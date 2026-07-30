-- Stockly: Stock Analyzer schema
-- Run this in the Supabase SQL editor after creating a new project.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ---------------------------------------------------------------------------
-- profiles: one row per authenticated user, holds notification preferences
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  alerts_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are self-readable" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles are self-writable" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles are self-insertable" on public.profiles
  for insert with check (auth.uid() = id);

-- Auto-create a profile row when a new user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- watchlist_items: tickers a user tracks, either "watching" or "owned".
-- Owned positions (shares_owned > 0) get a decline alert on any drop past
-- drop_alert_pct. Watch-only positions only alert when the drop coincides
-- with a rule-based "scope" (upside potential) signal.
-- ---------------------------------------------------------------------------
create table if not exists public.watchlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  ticker text not null,
  shares_owned numeric,
  avg_cost numeric,
  drop_alert_pct numeric not null default 5,
  target_price numeric,
  created_at timestamptz not null default now(),
  unique (user_id, ticker)
);

alter table public.watchlist_items enable row level security;

create policy "watchlist items are owner-scoped select" on public.watchlist_items
  for select using (auth.uid() = user_id);

create policy "watchlist items are owner-scoped insert" on public.watchlist_items
  for insert with check (auth.uid() = user_id);

create policy "watchlist items are owner-scoped update" on public.watchlist_items
  for update using (auth.uid() = user_id);

create policy "watchlist items are owner-scoped delete" on public.watchlist_items
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- alert_log: every alert email sent, used both for the "Alert History" view
-- and to de-duplicate (don't re-notify for the same condition within a day).
-- ---------------------------------------------------------------------------
create table if not exists public.alert_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  watchlist_item_id uuid references public.watchlist_items (id) on delete cascade,
  ticker text not null,
  alert_type text not null check (alert_type in ('price_drop', 'opportunity', 'target_reached')),
  price numeric not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.alert_log enable row level security;

create policy "alert log is owner-scoped select" on public.alert_log
  for select using (auth.uid() = user_id);

create index if not exists alert_log_dedupe_idx
  on public.alert_log (watchlist_item_id, alert_type, created_at desc);

-- ---------------------------------------------------------------------------
-- ai_analyses: short-lived cache of the AI verdict for a ticker so repeated
-- lookups (and the alert-check cron) don't all pay for a fresh Claude call.
-- ---------------------------------------------------------------------------
create table if not exists public.ai_analyses (
  ticker text primary key,
  company_name text,
  verdict text not null check (verdict in ('buy', 'hold', 'avoid')),
  has_scope boolean not null default false,
  rationale text not null,
  indicators jsonb not null,
  candles jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.ai_analyses enable row level security;

create policy "ai analyses are readable by any authenticated user" on public.ai_analyses
  for select using (auth.role() = 'authenticated');

-- Writes only happen from Edge Functions using the service role key, which
-- bypasses RLS, so no insert/update policy is needed for normal users.

-- ---------------------------------------------------------------------------
-- Scheduled job: invoke the check-price-alerts Edge Function every 30
-- minutes. Replace the URL/anon key placeholders after deploying functions,
-- or set them via `supabase secrets set` and reference them from a wrapper
-- function instead of hardcoding here.
-- ---------------------------------------------------------------------------
select cron.schedule(
  'check-price-alerts-every-30-min',
  '*/30 * * * *',
  $$
  select net.http_post(
    url := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/check-price-alerts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <YOUR_SERVICE_ROLE_KEY>'
    ),
    body := '{}'::jsonb
  );
  $$
);

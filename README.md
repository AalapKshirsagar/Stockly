# Stockly: AI Stock Analyzer & Price Alerts

Ask whether a stock is worth buying and get a plain-English verdict backed by
real technical indicators. Track a watchlist and get emailed when a stock you
own drops, or when a stock you're watching dips into what looks like a buying
opportunity ("scope").

## How it works

* **Ask the AI**: enter a ticker, and Stockly pulls price history and
  fundamentals, computes technical indicators (SMA20/50, RSI14, 52-week
  range, trend), and derives a deterministic `buy` / `hold` / `avoid`
  verdict. Claude then writes a short explanation of *why* the numbers
  support that verdict — it explains the data, it doesn't override it.
* **"Scope" detection**: a stock is flagged as having upside potential when
  it's oversold (low RSI) and/or well off its 52-week high, but not in a
  confirmed downtrend.
* **Watchlist alerts**: add a ticker as either a position you **own** (enter
  shares) or one you're just **watching**.
  * Owned positions email you on any drop past your configured threshold —
    a risk alert, regardless of scope.
  * Watch-only tickers only email you when a drop coincides with a "scope"
    signal — an opportunity alert, not just noise on every dip.
  * Either kind can also have a target price that triggers its own alert.
* A scheduled job re-checks every watchlist item every 30 minutes and
  de-duplicates so you don't get repeat emails for the same condition within
  24 hours.

## Deployment

* **Frontend**: Vercel (Vite + React + Tailwind)
* **Backend**: Supabase (Postgres, Auth, Edge Functions, pg_cron)
* **Market data**: [Finnhub](https://finnhub.io) (free tier)
* **AI reasoning**: Anthropic Claude API
* **Email**: [Resend](https://resend.com)

## Project Structure

* **`src/pages/`**: Route-level pages — Watchlist dashboard, Analyze
  ("Ask the AI"), Alert History, Login.
* **`src/components/`**: Verdict card, watchlist table, add-to-watchlist
  dialog, nav.
* **`src/lib/`**: Supabase client, auth context, shared types.
* **`shared/indicators.ts`**: Pure, tested functions for SMA/RSI/trend/scope
  — imported by both the frontend and the edge functions so the numbers
  shown in the UI and the numbers driving alerts never diverge.
* **`supabase/schema.sql`**: Tables, RLS policies, and the pg_cron schedule.
* **`supabase/functions/analyze-stock/`**: On-demand ticker analysis
  (Finnhub + indicators + Claude rationale), with a 15-minute cache.
* **`supabase/functions/check-price-alerts/`**: Scheduled job that scans the
  watchlist, detects drop/opportunity/target conditions, and sends email.

## Prerequisites

* **Node.js v18+**
* **Supabase account** (free tier is enough)
* **Finnhub account** — free API key at finnhub.io
* **Anthropic API key** — console.anthropic.com
* **Resend account** — free tier for transactional email
* **Vercel account** (for deployment, optional)

## Installation

1. **Clone the repository**:
   ```
   git clone https://github.com/[your-username]/stockly.git
   cd stockly
   ```

2. **Install dependencies**:
   ```
   npm install
   ```

3. **Configure environment**:
   * Copy `.env.example` to `.env.local` and fill in `VITE_SUPABASE_URL` /
     `VITE_SUPABASE_ANON_KEY`.

4. **Apply schema**:
   * Open the Supabase SQL editor and run `supabase/schema.sql`. Replace the
     `<YOUR_PROJECT_REF>` and `<YOUR_SERVICE_ROLE_KEY>` placeholders in the
     `cron.schedule` call at the bottom with your project's values (or set
     up the schedule after deploying the Edge Functions).

5. **Deploy Edge Functions and set secrets**:
   ```
   supabase functions deploy analyze-stock
   supabase functions deploy check-price-alerts
   supabase secrets set \
     FINNHUB_API_KEY=... \
     ANTHROPIC_API_KEY=... \
     RESEND_API_KEY=... \
     ALERT_FROM_EMAIL=alerts@yourdomain.com
   ```

6. **Run locally**:
   ```
   npm run dev
   ```

## Testing

```
npm test
```

Runs Vitest against `shared/indicators.ts` — the SMA/RSI/scope/verdict math
that both the UI and the alert job depend on.

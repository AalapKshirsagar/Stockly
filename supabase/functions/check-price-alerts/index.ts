import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { analyzeCandles } from "../../../shared/indicators.ts";
import { jsonResponse } from "../_shared/cors.ts";
import { getDailyCandles, getQuote } from "../_shared/finnhub.ts";
import { sendAlertEmail } from "../_shared/resend.ts";

const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000;

interface WatchlistRow {
  id: string;
  user_id: string;
  ticker: string;
  shares_owned: number | null;
  drop_alert_pct: number;
  target_price: number | null;
  profiles: { email: string; alerts_enabled: boolean } | null;
}

function supabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function alreadyAlertedRecently(
  supabase: ReturnType<typeof supabaseAdmin>,
  watchlistItemId: string,
  alertType: string,
): Promise<boolean> {
  const since = new Date(Date.now() - DEDUPE_WINDOW_MS).toISOString();
  const { data } = await supabase
    .from("alert_log")
    .select("id")
    .eq("watchlist_item_id", watchlistItemId)
    .eq("alert_type", alertType)
    .gte("created_at", since)
    .limit(1);
  return Boolean(data && data.length > 0);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, { status: 405 });

  const supabase = supabaseAdmin();

  const { data: items, error } = await supabase
    .from("watchlist_items")
    .select("id, user_id, ticker, shares_owned, drop_alert_pct, target_price, profiles(email, alerts_enabled)")
    .returns<WatchlistRow[]>();

  if (error) {
    console.error(error);
    return jsonResponse({ error: error.message }, { status: 500 });
  }
  if (!items || items.length === 0) return jsonResponse({ checked: 0, alerts: 0 });

  const byTicker = new Map<string, WatchlistRow[]>();
  for (const item of items) {
    if (!byTicker.has(item.ticker)) byTicker.set(item.ticker, []);
    byTicker.get(item.ticker)!.push(item);
  }

  let alertsSent = 0;

  for (const [ticker, watchers] of byTicker) {
    let quote;
    try {
      quote = await getQuote(ticker);
    } catch (err) {
      console.error(`Quote fetch failed for ${ticker}`, err);
      continue;
    }
    if (!quote.pc) continue;

    const pctChange = ((quote.c - quote.pc) / quote.pc) * 100;
    const isDrop = pctChange < 0;

    let scope: { hasScope: boolean; reasons: string[] } | null = null;
    if (isDrop) {
      try {
        const candles = await getDailyCandles(ticker, 120);
        scope = analyzeCandles(candles).scope;
      } catch (err) {
        console.error(`Candle fetch failed for ${ticker}`, err);
      }
    }

    for (const item of watchers) {
      if (!item.profiles || !item.profiles.alerts_enabled) continue;

      const isOwned = (item.shares_owned ?? 0) > 0;
      const dropExceedsThreshold = isDrop && Math.abs(pctChange) >= item.drop_alert_pct;

      if (dropExceedsThreshold && isOwned) {
        const already = await alreadyAlertedRecently(supabase, item.id, "price_drop");
        if (!already) {
          await notify(supabase, item, ticker, "price_drop", quote.c, pctChange, scope);
          alertsSent++;
        }
      } else if (dropExceedsThreshold && !isOwned && scope?.hasScope) {
        const already = await alreadyAlertedRecently(supabase, item.id, "opportunity");
        if (!already) {
          await notify(supabase, item, ticker, "opportunity", quote.c, pctChange, scope);
          alertsSent++;
        }
      }

      if (item.target_price !== null && quote.c <= item.target_price) {
        const already = await alreadyAlertedRecently(supabase, item.id, "target_reached");
        if (!already) {
          await notify(supabase, item, ticker, "target_reached", quote.c, pctChange, scope);
          alertsSent++;
        }
      }
    }
  }

  return jsonResponse({ checked: items.length, alerts: alertsSent });
});

async function notify(
  supabase: ReturnType<typeof supabaseAdmin>,
  item: WatchlistRow,
  ticker: string,
  alertType: "price_drop" | "opportunity" | "target_reached",
  price: number,
  pctChange: number,
  scope: { hasScope: boolean; reasons: string[] } | null,
): Promise<void> {
  const message = buildMessage(ticker, alertType, price, pctChange, scope);

  try {
    await sendAlertEmail(item.profiles!.email, subjectFor(ticker, alertType), message.html);
  } catch (err) {
    console.error(`Email send failed for ${ticker} -> ${item.profiles?.email}`, err);
    return;
  }

  await supabase.from("alert_log").insert({
    user_id: item.user_id,
    watchlist_item_id: item.id,
    ticker,
    alert_type: alertType,
    price,
    message: message.text,
  });
}

function subjectFor(ticker: string, alertType: string): string {
  if (alertType === "price_drop") return `${ticker} is down — price alert`;
  if (alertType === "opportunity") return `${ticker} dropped and may have upside — opportunity alert`;
  return `${ticker} hit your target price`;
}

function buildMessage(
  ticker: string,
  alertType: string,
  price: number,
  pctChange: number,
  scope: { hasScope: boolean; reasons: string[] } | null,
): { html: string; text: string } {
  const changeText = `${pctChange >= 0 ? "+" : ""}${pctChange.toFixed(2)}%`;
  let body: string;

  if (alertType === "price_drop") {
    body = `${ticker} is trading at $${price.toFixed(2)}, down ${changeText} vs the previous close on a position you hold.`;
  } else if (alertType === "opportunity") {
    const reasons = scope?.reasons.join("; ") ?? "";
    body = `${ticker} dropped ${changeText} to $${price.toFixed(2)} and the technicals suggest potential upside: ${reasons}.`;
  } else {
    body = `${ticker} reached your target price, now trading at $${price.toFixed(2)}.`;
  }

  return {
    text: body,
    html: `<p>${body}</p>`,
  };
}

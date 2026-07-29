import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { analyzeCandles } from "../../../shared/indicators.ts";
import type { StockAnalysis } from "../../../shared/types.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { generateRationale } from "../_shared/anthropic.ts";
import { getDailyCandles, getMetrics, getProfile } from "../_shared/finnhub.ts";

const CACHE_TTL_MS = 15 * 60 * 1000;

function supabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, { status: 405 });

  let ticker: string;
  try {
    const body = await req.json();
    ticker = String(body.ticker ?? "").trim().toUpperCase();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!ticker || !/^[A-Z.\-]{1,10}$/.test(ticker)) {
    return jsonResponse({ error: "Provide a valid ticker symbol" }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  const { data: cached } = await supabase
    .from("ai_analyses")
    .select("*")
    .eq("ticker", ticker)
    .maybeSingle();

  if (cached && Date.now() - new Date(cached.created_at).getTime() < CACHE_TTL_MS) {
    const analysis: StockAnalysis = {
      ticker,
      companyName: cached.company_name,
      verdict: cached.verdict,
      scope: { hasScope: cached.has_scope, reasons: cached.indicators.scopeReasons ?? [] },
      rationale: cached.rationale,
      indicators: cached.indicators,
    };
    return jsonResponse(analysis);
  }

  try {
    const [candles, profile, metrics] = await Promise.all([
      getDailyCandles(ticker),
      getProfile(ticker).catch(() => ({})),
      getMetrics(ticker).catch(() => ({})),
    ]);

    const signal = analyzeCandles(candles);
    const companyName = "name" in profile ? profile.name ?? null : null;
    const industry = "finnhubIndustry" in profile ? profile.finnhubIndustry ?? null : null;
    const peRatio = metrics.metric?.peBasicExclExtraTTM ?? null;

    const rationale = await generateRationale({
      ticker,
      companyName,
      industry,
      peRatio,
      verdict: signal.verdict,
      scope: signal.scope,
      indicators: signal.indicators,
    });

    const analysis: StockAnalysis = {
      ticker,
      companyName,
      verdict: signal.verdict,
      scope: signal.scope,
      rationale,
      indicators: signal.indicators,
    };

    await supabase.from("ai_analyses").upsert({
      ticker,
      company_name: companyName,
      verdict: signal.verdict,
      has_scope: signal.scope.hasScope,
      rationale,
      indicators: { ...signal.indicators, scopeReasons: signal.scope.reasons },
      created_at: new Date().toISOString(),
    });

    return jsonResponse(analysis);
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: message }, { status: 502 });
  }
});

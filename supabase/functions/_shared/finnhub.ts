import type { Candle } from "../../../shared/types.ts";

const FINNHUB_BASE = "https://finnhub.io/api/v1";

function apiKey(): string {
  const key = Deno.env.get("FINNHUB_API_KEY");
  if (!key) throw new Error("FINNHUB_API_KEY is not configured");
  return key;
}

async function finnhubGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${FINNHUB_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("token", apiKey());

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Finnhub request failed (${res.status}): ${path}`);
  }
  return (await res.json()) as T;
}

interface FinnhubQuote {
  c: number; // current price
  h: number; // day high
  l: number; // day low
  o: number; // day open
  pc: number; // previous close
}

interface FinnhubCandles {
  c: number[];
  h: number[];
  l: number[];
  v: number[];
  t: number[];
  s: string; // "ok" | "no_data"
}

interface FinnhubProfile {
  name?: string;
  ticker?: string;
  finnhubIndustry?: string;
  marketCapitalization?: number;
}

interface FinnhubMetrics {
  metric?: {
    peBasicExclExtraTTM?: number;
    "52WeekHigh"?: number;
    "52WeekLow"?: number;
  };
}

export async function getQuote(symbol: string): Promise<FinnhubQuote> {
  return finnhubGet<FinnhubQuote>("/quote", { symbol });
}

export async function getDailyCandles(symbol: string, daysBack = 365): Promise<Candle[]> {
  const to = Math.floor(Date.now() / 1000);
  const from = to - daysBack * 24 * 60 * 60;
  const data = await finnhubGet<FinnhubCandles>("/stock/candle", {
    symbol,
    resolution: "D",
    from: String(from),
    to: String(to),
  });

  if (data.s !== "ok" || !data.c || data.c.length === 0) {
    throw new Error(`No candle data available for ${symbol}`);
  }

  return data.c.map((close, i) => ({
    close,
    high: data.h[i],
    low: data.l[i],
    volume: data.v[i],
    timestamp: data.t[i],
  }));
}

export async function getProfile(symbol: string): Promise<FinnhubProfile> {
  return finnhubGet<FinnhubProfile>("/stock/profile2", { symbol });
}

export async function getMetrics(symbol: string): Promise<FinnhubMetrics> {
  return finnhubGet<FinnhubMetrics>("/stock/metric", { symbol, metric: "all" });
}

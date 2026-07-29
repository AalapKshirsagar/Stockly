import type { Scope, TechnicalIndicators, Verdict } from "../../../shared/types.ts";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-5";

function apiKey(): string {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) throw new Error("ANTHROPIC_API_KEY is not configured");
  return key;
}

interface RationaleInput {
  ticker: string;
  companyName: string | null;
  industry: string | null;
  peRatio: number | null;
  verdict: Verdict;
  scope: Scope;
  indicators: TechnicalIndicators;
}

/**
 * Asks Claude to turn the already-computed rule-based signal into a short,
 * plain-English rationale. Claude explains the numbers; it does not
 * override the deterministic verdict.
 */
export async function generateRationale(input: RationaleInput): Promise<string> {
  const { ticker, companyName, industry, peRatio, verdict, scope, indicators } = input;

  const prompt = `You are a stock analysis assistant. A rule-based system has already computed the verdict below from technical indicators. Write a concise (3-5 sentence) plain-English explanation of WHY the data supports this verdict, referencing the specific numbers. Do not contradict the given verdict. Do not give direct financial advice ("you should buy") - describe what the data shows instead.

Ticker: ${ticker}
Company: ${companyName ?? "unknown"}
Industry: ${industry ?? "unknown"}
P/E ratio (TTM): ${peRatio ?? "unavailable"}
Verdict: ${verdict}
Current price: ${indicators.price.toFixed(2)}
SMA20: ${indicators.sma20?.toFixed(2) ?? "n/a"}
SMA50: ${indicators.sma50?.toFixed(2) ?? "n/a"}
RSI14: ${indicators.rsi14?.toFixed(1) ?? "n/a"}
Trend: ${indicators.trend}
% from 52-week high: ${indicators.pctFrom52wHigh.toFixed(1)}%
% from 52-week low: ${indicators.pctFrom52wLow.toFixed(1)}%
Has "scope" (upside potential): ${scope.hasScope}
Scope reasons: ${scope.reasons.join("; ") || "none"}`;

  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey(),
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic request failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const textBlock = data.content?.find((block: { type: string }) => block.type === "text");
  return textBlock?.text ?? "No rationale available.";
}

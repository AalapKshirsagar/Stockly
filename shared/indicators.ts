import type { Candle, RuleBasedSignal, Scope, TechnicalIndicators, Verdict } from "./types";

/** Candles must be sorted oldest -> newest. */
export function sma(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  const window = closes.slice(closes.length - period);
  return window.reduce((sum, v) => sum + v, 0) / period;
}

/** Classic Wilder RSI over closing prices, oldest -> newest. */
export function rsi(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;

  let gains = 0;
  let losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const delta = closes[i] - closes[i - 1];
    if (delta >= 0) gains += delta;
    else losses -= delta;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function computeIndicators(candles: Candle[]): TechnicalIndicators {
  if (candles.length === 0) {
    throw new Error("computeIndicators requires at least one candle");
  }

  const closes = candles.map((c) => c.close);
  const price = closes[closes.length - 1];
  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const rsi14 = rsi(closes, 14);

  const week52High = Math.max(...candles.map((c) => c.high));
  const week52Low = Math.min(...candles.map((c) => c.low));

  const pctFrom52wHigh = ((price - week52High) / week52High) * 100;
  const pctFrom52wLow = ((price - week52Low) / week52Low) * 100;

  let trend: TechnicalIndicators["trend"] = "sideways";
  if (sma20 !== null && sma50 !== null) {
    if (sma20 > sma50 * 1.005) trend = "uptrend";
    else if (sma20 < sma50 * 0.995) trend = "downtrend";
  }

  return {
    price,
    sma20,
    sma50,
    rsi14,
    week52High,
    week52Low,
    pctFrom52wHigh,
    pctFrom52wLow,
    trend,
  };
}

/**
 * "Scope" = the dip looks like an opportunity rather than a stock in
 * genuine decline: oversold RSI, meaningfully off its 52-week high, and
 * not in a confirmed downtrend.
 */
export function assessScope(indicators: TechnicalIndicators): Scope {
  const reasons: string[] = [];

  const isOversold = indicators.rsi14 !== null && indicators.rsi14 < 35;
  const isDiscounted = indicators.pctFrom52wHigh <= -10;
  const isNearLow = indicators.pctFrom52wLow <= 15;
  const notCollapsing = indicators.trend !== "downtrend";

  if (isOversold) reasons.push(`RSI(14) at ${indicators.rsi14?.toFixed(1)} suggests oversold conditions`);
  if (isDiscounted) {
    reasons.push(`Trading ${Math.abs(indicators.pctFrom52wHigh).toFixed(1)}% below its 52-week high`);
  }
  if (isNearLow) reasons.push(`Trading within 15% of its 52-week low`);
  if (!notCollapsing) reasons.push(`Currently in a confirmed downtrend (SMA20 < SMA50)`);

  const hasScope = (isOversold || isDiscounted || isNearLow) && notCollapsing;

  return { hasScope, reasons };
}

export function computeVerdict(indicators: TechnicalIndicators, scope: Scope): Verdict {
  if (indicators.trend === "downtrend" && !scope.hasScope) return "avoid";
  if (scope.hasScope && indicators.trend !== "downtrend") return "buy";
  if (scope.hasScope && indicators.trend === "downtrend") return "hold";
  if (indicators.trend === "uptrend") return "buy";
  return "hold";
}

export function analyzeCandles(candles: Candle[]): RuleBasedSignal {
  const indicators = computeIndicators(candles);
  const scope = assessScope(indicators);
  const verdict = computeVerdict(indicators, scope);
  return { verdict, scope, indicators };
}

/** True when the latest close dropped at least `pct` percent versus the previous close. */
export function droppedByPct(candles: Candle[], pct: number): boolean {
  if (candles.length < 2) return false;
  const prev = candles[candles.length - 2].close;
  const latest = candles[candles.length - 1].close;
  return ((latest - prev) / prev) * 100 <= -Math.abs(pct);
}

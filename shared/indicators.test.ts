import { describe, expect, it } from "vitest";
import {
  analyzeCandles,
  assessScope,
  computeIndicators,
  computeVerdict,
  droppedByPct,
  rsi,
  sma,
} from "./indicators";
import type { Candle } from "./types";

function makeCandles(closes: number[]): Candle[] {
  return closes.map((close, i) => ({
    close,
    high: close * 1.01,
    low: close * 0.99,
    volume: 1_000_000,
    timestamp: i,
  }));
}

describe("sma", () => {
  it("returns null when there is not enough data", () => {
    expect(sma([1, 2, 3], 5)).toBeNull();
  });

  it("averages the trailing window", () => {
    expect(sma([1, 2, 3, 4, 5], 5)).toBe(3);
    expect(sma([10, 1, 2, 3, 4, 5], 5)).toBe(3);
  });
});

describe("rsi", () => {
  it("returns null when there is not enough data", () => {
    expect(rsi([1, 2, 3], 14)).toBeNull();
  });

  it("returns 100 for a strictly rising series", () => {
    const closes = Array.from({ length: 15 }, (_, i) => 100 + i);
    expect(rsi(closes, 14)).toBe(100);
  });

  it("returns a low value for a strictly falling series", () => {
    const closes = Array.from({ length: 15 }, (_, i) => 100 - i);
    expect(rsi(closes, 14)).toBe(0);
  });

  it("returns a mid-range value for a mixed series", () => {
    const closes = [100, 102, 101, 103, 102, 104, 103, 105, 104, 106, 105, 107, 106, 108, 107];
    const value = rsi(closes, 14)!;
    expect(value).toBeGreaterThan(0);
    expect(value).toBeLessThan(100);
  });
});

describe("computeIndicators", () => {
  it("computes price and 52-week range from candles", () => {
    const candles = makeCandles([90, 95, 100, 105, 110]);
    const indicators = computeIndicators(candles);
    expect(indicators.price).toBe(110);
    expect(indicators.week52High).toBeCloseTo(110 * 1.01);
    expect(indicators.week52Low).toBeCloseTo(90 * 0.99);
  });

  it("flags an uptrend when SMA20 is meaningfully above SMA50", () => {
    const closes = [
      ...Array.from({ length: 30 }, () => 100),
      ...Array.from({ length: 20 }, (_, i) => 120 + i),
    ];
    const indicators = computeIndicators(makeCandles(closes));
    expect(indicators.trend).toBe("uptrend");
  });

  it("flags a downtrend when SMA20 is meaningfully below SMA50", () => {
    const closes = [
      ...Array.from({ length: 30 }, () => 100),
      ...Array.from({ length: 20 }, (_, i) => 80 - i),
    ];
    const indicators = computeIndicators(makeCandles(closes));
    expect(indicators.trend).toBe("downtrend");
  });
});

describe("assessScope", () => {
  it("detects scope for an oversold stock off its highs but not collapsing", () => {
    const indicators = {
      price: 90,
      sma20: 91,
      sma50: 90,
      rsi14: 28,
      week52High: 110,
      week52Low: 85,
      pctFrom52wHigh: -18,
      pctFrom52wLow: 5,
      trend: "sideways" as const,
    };
    const scope = assessScope(indicators);
    expect(scope.hasScope).toBe(true);
    expect(scope.reasons.length).toBeGreaterThan(0);
  });

  it("does not grant scope to a stock in a confirmed downtrend", () => {
    const indicators = {
      price: 90,
      sma20: 85,
      sma50: 95,
      rsi14: 28,
      week52High: 110,
      week52Low: 85,
      pctFrom52wHigh: -18,
      pctFrom52wLow: 5,
      trend: "downtrend" as const,
    };
    expect(assessScope(indicators).hasScope).toBe(false);
  });

  it("does not grant scope to a stock near highs with normal RSI", () => {
    const indicators = {
      price: 108,
      sma20: 106,
      sma50: 100,
      rsi14: 55,
      week52High: 110,
      week52Low: 85,
      pctFrom52wHigh: -1.8,
      pctFrom52wLow: 27,
      trend: "uptrend" as const,
    };
    expect(assessScope(indicators).hasScope).toBe(false);
  });
});

describe("computeVerdict", () => {
  it("avoids a downtrending stock with no scope", () => {
    const indicators = {
      price: 90,
      sma20: 85,
      sma50: 95,
      rsi14: 50,
      week52High: 110,
      week52Low: 88,
      pctFrom52wHigh: -18,
      pctFrom52wLow: 2,
      trend: "downtrend" as const,
    };
    const scope = { hasScope: false, reasons: [] };
    expect(computeVerdict(indicators, scope)).toBe("avoid");
  });

  it("buys when scope is present outside of a downtrend", () => {
    const indicators = {
      price: 90,
      sma20: 91,
      sma50: 90,
      rsi14: 28,
      week52High: 110,
      week52Low: 85,
      pctFrom52wHigh: -18,
      pctFrom52wLow: 5,
      trend: "sideways" as const,
    };
    const scope = { hasScope: true, reasons: ["oversold"] };
    expect(computeVerdict(indicators, scope)).toBe("buy");
  });
});

describe("droppedByPct", () => {
  it("is false with fewer than two candles", () => {
    expect(droppedByPct(makeCandles([100]), 5)).toBe(false);
  });

  it("detects a drop meeting the threshold", () => {
    expect(droppedByPct(makeCandles([100, 94]), 5)).toBe(true);
  });

  it("does not flag a drop below the threshold", () => {
    expect(droppedByPct(makeCandles([100, 97]), 5)).toBe(false);
  });
});

describe("analyzeCandles", () => {
  it("produces a consistent verdict/scope/indicators bundle", () => {
    const candles = makeCandles(Array.from({ length: 60 }, (_, i) => 100 + Math.sin(i / 5) * 10));
    const result = analyzeCandles(candles);
    expect(["buy", "hold", "avoid"]).toContain(result.verdict);
    expect(result.indicators.price).toBe(candles[candles.length - 1].close);
  });
});

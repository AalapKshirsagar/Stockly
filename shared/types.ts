export interface Candle {
  close: number;
  high: number;
  low: number;
  volume: number;
  timestamp: number;
}

export interface TechnicalIndicators {
  price: number;
  sma20: number | null;
  sma50: number | null;
  rsi14: number | null;
  week52High: number;
  week52Low: number;
  pctFrom52wHigh: number;
  pctFrom52wLow: number;
  trend: "uptrend" | "downtrend" | "sideways";
}

export type Verdict = "buy" | "hold" | "avoid";

export interface Scope {
  hasScope: boolean;
  reasons: string[];
}

export interface RuleBasedSignal {
  verdict: Verdict;
  scope: Scope;
  indicators: TechnicalIndicators;
}

export interface StockAnalysis extends RuleBasedSignal {
  ticker: string;
  companyName: string | null;
  rationale: string;
}

import type { StockAnalysis } from "../lib/types";
import { PriceChart } from "./PriceChart";

const verdictStyles: Record<StockAnalysis["verdict"], string> = {
  buy: "bg-good-tint text-good border-good-border",
  hold: "bg-warn-tint text-warn border-warn-border",
  avoid: "bg-bad-tint text-bad border-bad-border",
};

export function StockVerdictCard({ analysis }: { analysis: StockAnalysis }) {
  const { indicators } = analysis;

  return (
    <div className="border border-line bg-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl font-bold text-ink">
            {analysis.ticker}
            {analysis.companyName ? (
              <span className="font-sans text-base font-normal text-ink-faint"> · {analysis.companyName}</span>
            ) : (
              ""
            )}
          </h2>
          <p className="mt-1 font-mono text-2xl font-bold text-ink">${indicators.price.toFixed(2)}</p>
        </div>
        <span className={`border px-2 py-0.5 font-mono text-sm font-bold ${verdictStyles[analysis.verdict]}`}>
          [ {analysis.verdict.toUpperCase()} ]
        </span>
      </div>

      {analysis.scope.hasScope && (
        <div className="mt-3 border border-scope-border bg-scope-tint p-3 text-sm text-scope">
          <p className="font-semibold">Scope detected (potential upside)</p>
          <ul className="mt-1 list-inside list-disc">
            {analysis.scope.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-4 text-sm leading-relaxed text-ink">{analysis.rationale}</p>

      <PriceChart candles={analysis.candles} />

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm sm:grid-cols-3">
        <Metric label="Trend" value={indicators.trend} />
        <Metric label="RSI (14)" value={indicators.rsi14?.toFixed(1) ?? "n/a"} />
        <Metric label="SMA 20" value={indicators.sma20 ? `$${indicators.sma20.toFixed(2)}` : "n/a"} />
        <Metric label="SMA 50" value={indicators.sma50 ? `$${indicators.sma50.toFixed(2)}` : "n/a"} />
        <Metric label="52w High" value={`$${indicators.week52High.toFixed(2)}`} />
        <Metric label="52w Low" value={`$${indicators.week52Low.toFixed(2)}`} />
      </dl>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.64rem] uppercase tracking-wider text-ink-faint">{label}</dt>
      <dd className="font-mono font-bold text-ink">{value}</dd>
    </div>
  );
}

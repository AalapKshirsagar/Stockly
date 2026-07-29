import type { StockAnalysis } from "../lib/types";

const verdictStyles: Record<StockAnalysis["verdict"], string> = {
  buy: "bg-emerald-100 text-emerald-800 border-emerald-300",
  hold: "bg-amber-100 text-amber-800 border-amber-300",
  avoid: "bg-rose-100 text-rose-800 border-rose-300",
};

export function StockVerdictCard({ analysis }: { analysis: StockAnalysis }) {
  const { indicators } = analysis;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {analysis.ticker}
            {analysis.companyName ? ` · ${analysis.companyName}` : ""}
          </h2>
          <p className="text-2xl font-semibold text-slate-800">${indicators.price.toFixed(2)}</p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-sm font-semibold uppercase ${verdictStyles[analysis.verdict]}`}
        >
          {analysis.verdict}
        </span>
      </div>

      {analysis.scope.hasScope && (
        <div className="mt-3 rounded-md bg-sky-50 p-3 text-sm text-sky-800">
          <p className="font-semibold">Scope detected (potential upside)</p>
          <ul className="mt-1 list-inside list-disc">
            {analysis.scope.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-4 text-sm leading-relaxed text-slate-700">{analysis.rationale}</p>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
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
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-800">{value}</dd>
    </div>
  );
}

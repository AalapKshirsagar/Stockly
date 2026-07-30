import { useState } from "react";
import { AddToWatchlistDialog } from "../components/AddToWatchlistDialog";
import { StockVerdictCard } from "../components/StockVerdictCard";
import { supabase } from "../lib/supabaseClient";
import type { StockAnalysis } from "../lib/types";

export function AnalyzePage() {
  const [ticker, setTicker] = useState("");
  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    const symbol = ticker.trim().toUpperCase();
    if (!symbol) return;

    setLoading(true);
    setError(null);
    setAnalysis(null);

    const { data, error: fnError } = await supabase.functions.invoke("analyze-stock", {
      body: { ticker: symbol },
    });

    setLoading(false);
    if (fnError) {
      setError(fnError.message);
      return;
    }
    if (data?.error) {
      setError(data.error);
      return;
    }
    setAnalysis(data as StockAnalysis);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="font-serif text-2xl font-bold text-ink">Ask the AI</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Enter a ticker symbol to get a buy/hold/avoid verdict based on technical indicators, with an
        AI-written explanation.
      </p>

      <form onSubmit={handleAnalyze} className="mt-4 flex gap-2">
        <input
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          placeholder="e.g. AAPL"
          className="flex-1 border border-line-strong bg-surface px-3 py-2 font-mono text-sm uppercase text-ink"
        />
        <button
          type="submit"
          disabled={loading}
          className="border border-brass bg-brass px-4 py-2 text-sm font-bold text-surface hover:border-brass-strong hover:bg-brass-strong disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-bad">{error}</p>}

      {analysis && (
        <div className="mt-6 space-y-4">
          <StockVerdictCard analysis={analysis} />
          <button
            onClick={() => setShowAddDialog(true)}
            className="w-full border border-line-strong px-4 py-2 text-sm font-medium text-ink hover:bg-surface2"
          >
            + Add {analysis.ticker} to watchlist
          </button>
        </div>
      )}

      {showAddDialog && analysis && (
        <AddToWatchlistDialog
          ticker={analysis.ticker}
          onClose={() => setShowAddDialog(false)}
          onAdded={() => setShowAddDialog(false)}
        />
      )}
    </div>
  );
}

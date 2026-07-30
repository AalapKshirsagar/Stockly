import { useState } from "react";
import { useAuth } from "../lib/auth/AuthProvider";
import { supabase } from "../lib/supabaseClient";

interface Props {
  ticker: string;
  onClose: () => void;
  onAdded: () => void;
}

export function AddToWatchlistDialog({ ticker, onClose, onAdded }: Props) {
  const { user } = useAuth();
  const [sharesOwned, setSharesOwned] = useState("");
  const [avgCost, setAvgCost] = useState("");
  const [dropAlertPct, setDropAlertPct] = useState("5");
  const [targetPrice, setTargetPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase.from("watchlist_items").upsert(
      {
        user_id: user.id,
        ticker,
        shares_owned: sharesOwned ? Number(sharesOwned) : null,
        avg_cost: avgCost ? Number(avgCost) : null,
        drop_alert_pct: Number(dropAlertPct) || 5,
        target_price: targetPrice ? Number(targetPrice) : null,
      },
      { onConflict: "user_id,ticker" },
    );

    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    onAdded();
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm border border-line-strong bg-surface p-6">
        <h3 className="font-serif text-lg font-bold text-ink">Add {ticker} to watchlist</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <Field label="Shares owned (leave blank if just watching)">
            <input
              type="number"
              step="any"
              value={sharesOwned}
              onChange={(e) => setSharesOwned(e.target.value)}
              className="w-full border border-line-strong bg-surface px-3 py-2 font-mono text-sm text-ink"
            />
          </Field>
          <Field label="Average cost per share">
            <input
              type="number"
              step="any"
              value={avgCost}
              onChange={(e) => setAvgCost(e.target.value)}
              className="w-full border border-line-strong bg-surface px-3 py-2 font-mono text-sm text-ink"
            />
          </Field>
          <Field label="Alert me when it drops (%)">
            <input
              type="number"
              step="any"
              value={dropAlertPct}
              onChange={(e) => setDropAlertPct(e.target.value)}
              className="w-full border border-line-strong bg-surface px-3 py-2 font-mono text-sm text-ink"
              required
            />
          </Field>
          <Field label="Target price alert (optional)">
            <input
              type="number"
              step="any"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="w-full border border-line-strong bg-surface px-3 py-2 font-mono text-sm text-ink"
            />
          </Field>

          {error && <p className="text-sm text-bad">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-ink-muted hover:bg-surface2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="border border-brass bg-brass px-4 py-2 text-sm font-bold text-surface hover:border-brass-strong hover:bg-brass-strong disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-faint">{label}</span>
      {children}
    </label>
  );
}

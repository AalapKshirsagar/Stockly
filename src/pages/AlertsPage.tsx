import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { AlertLogEntry } from "../lib/types";

const typeLabels: Record<AlertLogEntry["alert_type"], string> = {
  price_drop: "Price drop",
  opportunity: "Opportunity",
  target_reached: "Target reached",
};

const typeStyles: Record<AlertLogEntry["alert_type"], string> = {
  price_drop: "bg-bad-tint text-bad border-bad-border",
  opportunity: "bg-warn-tint text-warn border-warn-border",
  target_reached: "bg-good-tint text-good border-good-border",
};

export function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("alert_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setAlerts(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="font-serif text-2xl font-bold text-ink">Alert history</h1>
      <p className="mt-1 text-sm text-ink-muted">Every email alert sent to you, most recent first.</p>

      <div className="mt-6 space-y-3">
        {loading && <p className="text-ink-muted">Loading...</p>}
        {!loading && alerts.length === 0 && (
          <p className="border border-dashed border-line-strong p-8 text-center text-ink-faint">
            No alerts yet.
          </p>
        )}
        {alerts.map((alert) => (
          <div key={alert.id} className="border border-line bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 font-mono font-bold text-ink">
                {alert.ticker}
                <span className={`border px-2 py-0.5 text-xs font-bold ${typeStyles[alert.alert_type]}`}>
                  {typeLabels[alert.alert_type]}
                </span>
              </span>
              <span className="font-mono text-xs text-ink-faint">
                {new Date(alert.created_at).toLocaleString()}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-muted">{alert.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

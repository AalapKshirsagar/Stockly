import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { AlertLogEntry } from "../lib/types";

const typeLabels: Record<AlertLogEntry["alert_type"], string> = {
  price_drop: "Price drop",
  opportunity: "Opportunity",
  target_reached: "Target reached",
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
      <h1 className="text-2xl font-bold text-slate-900">Alert History</h1>
      <p className="mt-1 text-sm text-slate-500">Every email alert sent to you, most recent first.</p>

      <div className="mt-6 space-y-3">
        {loading && <p className="text-slate-500">Loading...</p>}
        {!loading && alerts.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
            No alerts yet.
          </p>
        )}
        {alerts.map((alert) => (
          <div key={alert.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-900">
                {alert.ticker} · {typeLabels[alert.alert_type]}
              </span>
              <span className="text-slate-400">{new Date(alert.created_at).toLocaleString()}</span>
            </div>
            <p className="mt-1 text-sm text-slate-600">{alert.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

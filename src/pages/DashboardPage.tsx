import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth/AuthProvider";
import { supabase } from "../lib/supabaseClient";
import type { WatchlistItem } from "../lib/types";
import { WatchlistTable } from "../components/WatchlistTable";

export function DashboardPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("watchlist_items")
      .select("*")
      .order("created_at", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  }

  async function handleRemove(id: string) {
    await supabase.from("watchlist_items").delete().eq("id", id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Your Watchlist</h1>
      <p className="mt-1 text-sm text-slate-500">
        Owned positions alert on any drop past your threshold. Watch-only tickers alert when a drop
        coincides with a "scope" (upside potential) signal.
      </p>

      <div className="mt-6">
        {loading ? <p className="text-slate-500">Loading...</p> : <WatchlistTable items={items} onRemove={handleRemove} />}
      </div>
    </div>
  );
}

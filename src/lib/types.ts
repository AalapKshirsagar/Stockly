export interface WatchlistItem {
  id: string;
  user_id: string;
  ticker: string;
  shares_owned: number | null;
  avg_cost: number | null;
  drop_alert_pct: number;
  target_price: number | null;
  created_at: string;
}

export interface AlertLogEntry {
  id: string;
  ticker: string;
  alert_type: "price_drop" | "opportunity" | "target_reached";
  price: number;
  message: string;
  created_at: string;
}

export * from "../../shared/types";

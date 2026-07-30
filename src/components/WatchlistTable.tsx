import type { WatchlistItem } from "../lib/types";

interface Props {
  items: WatchlistItem[];
  onRemove: (id: string) => void;
}

export function WatchlistTable({ items, onRemove }: Props) {
  if (items.length === 0) {
    return (
      <p className="border border-dashed border-line-strong p-8 text-center text-ink-faint">
        No stocks yet. Search a ticker on the Analyze page and add it to your watchlist.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto border border-line bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th className="border-b border-line-strong px-4 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-ink-faint">
              Ticker
            </th>
            <th className="border-b border-line-strong px-4 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-ink-faint">
              Position
            </th>
            <th className="border-b border-line-strong px-4 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-ink-faint">
              Drop alert
            </th>
            <th className="border-b border-line-strong px-4 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-ink-faint">
              Target price
            </th>
            <th className="border-b border-line-strong px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-surface2">
              <td className="border-b border-line px-4 py-3 font-mono font-bold text-ink">{item.ticker}</td>
              <td className="border-b border-line px-4 py-3">
                <span className="border border-line-strong bg-surface2 px-2 py-0.5 font-mono text-xs text-ink-muted">
                  {item.shares_owned ? `${item.shares_owned} sh owned` : "watching"}
                </span>
              </td>
              <td className="border-b border-line px-4 py-3 font-mono text-ink-muted">{item.drop_alert_pct}%</td>
              <td className="border-b border-line px-4 py-3 font-mono text-ink-muted">
                {item.target_price ? `$${item.target_price}` : "—"}
              </td>
              <td className="border-b border-line px-4 py-3 text-right">
                <button onClick={() => onRemove(item.id)} className="text-bad hover:underline">
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

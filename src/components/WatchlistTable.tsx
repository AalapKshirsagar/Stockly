import type { WatchlistItem } from "../lib/types";

interface Props {
  items: WatchlistItem[];
  onRemove: (id: string) => void;
}

export function WatchlistTable({ items, onRemove }: Props) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
        No stocks yet. Search a ticker on the Analyze page and add it to your watchlist.
      </p>
    );
  }

  return (
    <table className="w-full overflow-hidden rounded-lg border border-slate-200 text-left text-sm">
      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
        <tr>
          <th className="px-4 py-3">Ticker</th>
          <th className="px-4 py-3">Position</th>
          <th className="px-4 py-3">Drop alert</th>
          <th className="px-4 py-3">Target price</th>
          <th className="px-4 py-3" />
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {items.map((item) => (
          <tr key={item.id}>
            <td className="px-4 py-3 font-semibold text-slate-900">{item.ticker}</td>
            <td className="px-4 py-3 text-slate-600">
              {item.shares_owned ? `${item.shares_owned} shares owned` : "Watching only"}
            </td>
            <td className="px-4 py-3 text-slate-600">{item.drop_alert_pct}%</td>
            <td className="px-4 py-3 text-slate-600">
              {item.target_price ? `$${item.target_price}` : "—"}
            </td>
            <td className="px-4 py-3 text-right">
              <button onClick={() => onRemove(item.id)} className="text-rose-600 hover:underline">
                Remove
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

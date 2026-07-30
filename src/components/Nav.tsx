import { NavLink } from "react-router-dom";
import { useAuth } from "../lib/auth/AuthProvider";

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `border-b-2 pb-2.5 pt-2 text-sm font-semibold tracking-tight ${
    isActive ? "border-brass text-ink" : "border-transparent text-ink-faint hover:text-ink-muted"
  }`;

export function Nav() {
  const { user, signOut } = useAuth();
  if (!user) return null;

  return (
    <header className="mx-auto max-w-4xl px-6 pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div className="font-serif text-2xl font-bold text-ink">
          Stockly
          <small className="ml-3 align-middle font-sans text-xs font-medium uppercase tracking-widest text-ink-faint">
            AI stock analyzer &amp; price alerts
          </small>
        </div>
        <div className="font-mono text-xs text-ink-faint">{user.email}</div>
      </div>
      <hr className="mt-3 border-t-[3px] border-double border-line-strong" />
      <nav className="mt-0.5 flex gap-6">
        <NavLink to="/" className={tabClass} end>
          Watchlist
        </NavLink>
        <NavLink to="/analyze" className={tabClass}>
          Analyze
        </NavLink>
        <NavLink to="/alerts" className={tabClass}>
          Alert History
        </NavLink>
        <button
          onClick={() => signOut()}
          className="ml-auto pb-2.5 pt-2 text-sm text-ink-faint hover:text-ink-muted"
        >
          Sign out
        </button>
      </nav>
    </header>
  );
}

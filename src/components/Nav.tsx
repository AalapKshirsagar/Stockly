import { NavLink } from "react-router-dom";
import { useAuth } from "../lib/auth/AuthProvider";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${
    isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
  }`;

export function Nav() {
  const { user, signOut } = useAuth();
  if (!user) return null;

  return (
    <nav className="flex items-center justify-between border-b border-slate-200 px-6 py-3">
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-slate-900">Stockly</span>
        <NavLink to="/" className={linkClass} end>
          Watchlist
        </NavLink>
        <NavLink to="/analyze" className={linkClass}>
          Analyze
        </NavLink>
        <NavLink to="/alerts" className={linkClass}>
          Alert History
        </NavLink>
      </div>
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span>{user.email}</span>
        <button onClick={() => signOut()} className="text-slate-600 hover:text-slate-900">
          Sign out
        </button>
      </div>
    </nav>
  );
}

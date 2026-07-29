import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth/AuthProvider";

export function LoginPage() {
  const { user, signInWithPassword, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setInfo(null);

    const result = mode === "signin" ? await signInWithPassword(email, password) : await signUp(email, password);

    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else if (mode === "signup") {
      setInfo("Check your email to confirm your account.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Stockly</h1>
        <p className="mt-1 text-sm text-slate-500">AI-assisted stock analysis and price alerts.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />

          {error && <p className="text-sm text-rose-600">{error}</p>}
          {info && <p className="text-sm text-emerald-600">{info}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? "Please wait..." : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 text-sm text-slate-500 hover:text-slate-800"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}

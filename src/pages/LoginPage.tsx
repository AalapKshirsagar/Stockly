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
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="w-full max-w-sm border border-line bg-surface p-8">
        <h1 className="font-serif text-2xl font-bold text-ink">Stockly</h1>
        <p className="mt-1 text-sm text-ink-muted">AI-assisted stock analysis and price alerts.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-line-strong bg-surface px-3 py-2 text-sm text-ink"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full border border-line-strong bg-surface px-3 py-2 text-sm text-ink"
          />

          {error && <p className="text-sm text-bad">{error}</p>}
          {info && <p className="text-sm text-good">{info}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full border border-brass bg-brass px-4 py-2 text-sm font-bold text-surface hover:border-brass-strong hover:bg-brass-strong disabled:opacity-50"
          >
            {submitting ? "Please wait..." : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 text-sm text-ink-faint hover:text-ink-muted"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}

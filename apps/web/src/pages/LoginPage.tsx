import React from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../lib/auth";
import { useAuth } from "../app/AuthProvider";

export function LoginPage() {
  const nav = useNavigate();
  const { state, setAuthed } = useAuth();

  const [email, setEmail] = React.useState("admin@fairgit.local");
  const [password, setPassword] = React.useState("Admin123!");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (state.status === "authed") nav("/", { replace: true });
  }, [state, nav]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const r = await login(email, password);
      setAuthed(r.email, r.role);
      nav("/", { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white border rounded-2xl p-6">
        <h1 className="text-xl font-semibold">Login</h1>
        <p className="text-sm text-gray-600 mt-1">Sign in to continue</p>

        <div className="mt-6 space-y-3">
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <div className="text-sm text-red-600">{error}</div>}

          <button disabled={loading} className="w-full rounded-lg px-3 py-2 bg-black text-white disabled:opacity-60">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>
      </form>
    </div>
  );
}
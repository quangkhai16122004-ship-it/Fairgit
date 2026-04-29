import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../lib/auth";
import { useAuth } from "../app/AuthProvider";
import { toErrorMessage } from "../lib/errorMessage";
import { useLang } from "../app/LanguageContext";
import { translations as T, tr } from "../lib/translations";

export function LoginPage() {
  const nav = useNavigate();
  const { state, setAuthed } = useAuth();
  const { lang } = useLang();

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
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  }

  const l = T.login;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white border rounded-2xl p-6">
        <h1 className="text-xl font-semibold">{tr(l.title, lang)}</h1>
        <p className="text-sm text-gray-600 mt-1">{tr(l.subtitle, lang)}</p>

        <div className="mt-6 space-y-3">
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder={tr(l.email, lang)}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder={tr(l.password, lang)}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <div className="text-sm text-red-600">{error}</div>}

          <button disabled={loading} className="w-full rounded-lg px-3 py-2 bg-black text-white disabled:opacity-60">
            {loading ? tr(l.signingIn, lang) : tr(l.signIn, lang)}
          </button>

          <div className="text-sm text-gray-600 text-center">
            {tr(l.noAccount, lang)}{" "}
            <Link to="/register" className="underline">
              {tr(l.createAccount, lang)}
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}

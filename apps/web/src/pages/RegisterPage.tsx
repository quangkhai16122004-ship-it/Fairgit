import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../lib/auth";
import { useAuth } from "../app/AuthProvider";
import { toErrorMessage } from "../lib/errorMessage";
import { useLang } from "../app/LanguageContext";
import { translations as T, tr } from "../lib/translations";

export function RegisterPage() {
  const nav = useNavigate();
  const { state, setAuthed } = useAuth();
  const { lang } = useLang();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
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
      if (password !== confirmPassword) {
        throw new Error(tr(T.register.passwordMismatch, lang));
      }

      const r = await register(email, password);
      setAuthed(r.email, r.role);
      nav("/", { replace: true });
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Register failed"));
    } finally {
      setLoading(false);
    }
  }

  const r = T.register;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white border rounded-2xl p-6">
        <h1 className="text-xl font-semibold">{tr(r.title, lang)}</h1>
        <p className="text-sm text-gray-600 mt-1">{tr(r.subtitle, lang)}</p>

        <div className="mt-6 space-y-3">
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder={tr(r.email, lang)}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder={tr(r.password, lang)}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder={tr(r.confirmPassword, lang)}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <div className="text-xs text-gray-500">
            {tr(r.passwordHint, lang)}
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <button disabled={loading} className="w-full rounded-lg px-3 py-2 bg-black text-white disabled:opacity-60">
            {loading ? tr(r.creating, lang) : tr(r.create, lang)}
          </button>

          <div className="text-sm text-gray-600 text-center">
            {tr(r.haveAccount, lang)}{" "}
            <Link to="/login" className="underline">
              {tr(r.signIn, lang)}
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}

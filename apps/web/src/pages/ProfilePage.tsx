import React from "react";
import { changePassword } from "../lib/auth";
import { useAuth } from "../app/AuthProvider";
import { toErrorMessage } from "../lib/errorMessage";
import { useLang } from "../app/LanguageContext";
import { translations as T, tr } from "../lib/translations";

const ROLE_BADGE: Record<string, string> = {
  admin:   "bg-red-100 text-red-700",
  manager: "bg-blue-100 text-blue-700",
  member:  "bg-gray-100 text-gray-600",
};

export function ProfilePage() {
  const { lang } = useLang();
  const { state } = useAuth();
  const t = T.profile;

  const [currentPw, setCurrentPw] = React.useState("");
  const [newPw, setNewPw] = React.useState("");
  const [confirmPw, setConfirmPw] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPw !== confirmPw) {
      setError(tr(t.passwordMismatch, lang));
      return;
    }

    setSaving(true);
    try {
      await changePassword(currentPw, newPw);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setSuccess(true);
    } catch (err) {
      setError(toErrorMessage(err, "Change password failed"));
    } finally {
      setSaving(false);
    }
  }

  if (state.status !== "authed") return null;

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-xl font-semibold">{tr(t.title, lang)}</h1>
        <p className="text-sm text-gray-600 mt-1">{tr(t.subtitle, lang)}</p>
      </div>

      {/* Thông tin tài khoản */}
      <div className="bg-white border rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{tr(t.email, lang)}</span>
          <span className="font-mono text-sm">{state.email}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{tr(t.role, lang)}</span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE[state.role] ?? ""}`}>
            {state.role}
          </span>
        </div>
      </div>

      {/* Form đổi mật khẩu */}
      <form onSubmit={onSubmit} className="bg-white border rounded-2xl p-4 space-y-4">
        <div className="font-medium text-sm">{tr(t.changePassword, lang)}</div>

        <div className="space-y-3">
          <div>
            <div className="text-xs text-gray-600 mb-1">{tr(t.currentPassword, lang)}</div>
            <input
              type="password"
              required
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">{tr(t.newPassword, lang)}</div>
            <input
              type="password"
              required
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">{tr(t.confirmPassword, lang)}</div>
            <input
              type="password"
              required
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
        {success && <div className="text-sm text-green-600">{tr(t.successMsg, lang)}</div>}

        <button
          disabled={saving}
          className="rounded-lg bg-black text-white px-4 py-2 text-sm disabled:opacity-60"
        >
          {saving ? tr(t.saving, lang) : tr(t.save, lang)}
        </button>
      </form>
    </div>
  );
}

import React from "react";
import { listUsers, changeRole, deleteUser, resetPassword } from "../lib/users";
import type { UserItem } from "../lib/users";
import { toErrorMessage } from "../lib/errorMessage";
import { useLang } from "../app/LanguageContext";
import { translations as T, tr } from "../lib/translations";

const ROLE_OPTIONS: UserItem["role"][] = ["admin", "manager", "member"];

const ROLE_BADGE: Record<UserItem["role"], string> = {
  admin:   "bg-red-100 text-red-700",
  manager: "bg-blue-100 text-blue-700",
  member:  "bg-gray-100 text-gray-600",
};

export function UsersPage() {
  const { lang } = useLang();
  const t = T.users;

  const [items, setItems] = React.useState<UserItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [savingId, setSavingId] = React.useState<string | null>(null);

  // inline reset password state
  const [resetId, setResetId] = React.useState<string | null>(null);
  const [resetPw, setResetPw] = React.useState("");
  const [resetSaving, setResetSaving] = React.useState(false);
  const [resetDoneId, setResetDoneId] = React.useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setItems(await listUsers());
    } catch (err) {
      setError(toErrorMessage(err, "Load failed"));
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { refresh(); }, []);

  async function onChangeRole(user: UserItem, role: UserItem["role"]) {
    setSavingId(user._id);
    setError(null);
    try {
      const updated = await changeRole(user._id, role);
      setItems((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
    } catch (err) {
      setError(toErrorMessage(err, "Change role failed"));
    } finally {
      setSavingId(null);
    }
  }

  async function onResetPassword(id: string) {
    setResetSaving(true);
    setError(null);
    try {
      await resetPassword(id, resetPw);
      setResetId(null);
      setResetPw("");
      setResetDoneId(id);
      setTimeout(() => setResetDoneId(null), 3000);
    } catch (err) {
      setError(toErrorMessage(err, "Reset password failed"));
    } finally {
      setResetSaving(false);
    }
  }

  async function onDelete(user: UserItem) {
    if (!window.confirm(tr(t.confirmDelete, lang))) return;
    setSavingId(user._id);
    setError(null);
    try {
      await deleteUser(user._id);
      setItems((prev) => prev.filter((u) => u._id !== user._id));
    } catch (err) {
      setError(toErrorMessage(err, "Delete failed"));
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{tr(t.title, lang)}</h1>
        <p className="text-sm text-gray-600 mt-1">{tr(t.subtitle, lang)}</p>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      <div className="bg-white border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-medium">
            {items.length} {tr(t.total, lang)}
          </div>
          <button
            onClick={refresh}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            {tr(t.refresh, lang)}
          </button>
        </div>

        {loading ? (
          <div className="p-4 text-sm text-gray-500">{tr(t.loading, lang)}</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">{tr(t.noUsers, lang)}</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600">{tr(t.email, lang)}</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">{tr(t.role, lang)}</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">{tr(t.createdAt, lang)}</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">{tr(t.actions, lang)}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE[user.role]}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <select
                          value={user.role}
                          disabled={savingId === user._id}
                          onChange={(e) => onChangeRole(user, e.target.value as UserItem["role"])}
                          className="border rounded-lg px-2 py-1 text-xs disabled:opacity-50"
                        >
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>

                        <button
                          onClick={() => { setResetId(resetId === user._id ? null : user._id); setResetPw(""); setError(null); }}
                          className="rounded-lg border border-yellow-200 px-2.5 py-1 text-xs text-yellow-700 hover:bg-yellow-50"
                        >
                          {tr(t.resetPassword, lang)}
                        </button>

                        <button
                          disabled={savingId === user._id}
                          onClick={() => onDelete(user)}
                          className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          {savingId === user._id ? tr(t.saving, lang) : tr(t.delete, lang)}
                        </button>
                      </div>

                      {resetDoneId === user._id && (
                        <div className="text-xs text-green-600">{tr(t.resetDone, lang)}</div>
                      )}

                      {resetId === user._id && (
                        <div className="flex items-center gap-2">
                          <input
                            type="password"
                            placeholder={tr(t.newPassword, lang)}
                            value={resetPw}
                            onChange={(e) => setResetPw(e.target.value)}
                            className="border rounded-lg px-2 py-1 text-xs w-40"
                          />
                          <button
                            disabled={resetSaving || !resetPw}
                            onClick={() => onResetPassword(user._id)}
                            className="rounded-lg bg-black text-white px-2.5 py-1 text-xs disabled:opacity-50"
                          >
                            {resetSaving ? tr(t.resetSaving, lang) : tr(t.save, lang)}
                          </button>
                          <button
                            onClick={() => { setResetId(null); setResetPw(""); }}
                            className="rounded-lg border px-2.5 py-1 text-xs hover:bg-gray-50"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

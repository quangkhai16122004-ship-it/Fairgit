import React from "react";
import { createProject, updateProject, deleteProject, listProjects } from "../lib/projects";
import type { Project } from "../lib/projects";
import { toErrorMessage } from "../lib/errorMessage";
import { useLang } from "../app/LanguageContext";
import { useAuth } from "../app/AuthProvider";
import { translations as T, tr } from "../lib/translations";

export function ProjectsPage() {
  const { lang } = useLang();
  const { state } = useAuth();
  const isAdmin = state.status === "authed" && state.role === "admin";

  const [items, setItems] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [name, setName] = React.useState("");
  const [repoUrl, setRepoUrl] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // inline edit state
  const [editId, setEditId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editRepoUrl, setEditRepoUrl] = React.useState("");
  const [editSaving, setEditSaving] = React.useState(false);

  async function refresh() {
    setLoading(true);
    try {
      setItems(await listProjects());
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { refresh(); }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (!name.trim()) throw new Error(tr(T.projects.nameRequired, lang));
      if (!repoUrl.trim()) throw new Error(tr(T.projects.urlRequired, lang));
      await createProject({ name: name.trim(), repoUrl: repoUrl.trim() });
      setName("");
      setRepoUrl("");
      await refresh();
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Create failed"));
    } finally {
      setSaving(false);
    }
  }

  function startEdit(item: Project) {
    setEditId(item._id);
    setEditName(item.name);
    setEditRepoUrl(item.repoUrl);
    setError(null);
  }

  function cancelEdit() {
    setEditId(null);
  }

  async function onSaveEdit(id: string) {
    setEditSaving(true);
    setError(null);
    try {
      if (!editName.trim()) throw new Error(tr(T.projects.nameRequired, lang));
      if (!editRepoUrl.trim()) throw new Error(tr(T.projects.urlRequired, lang));
      const updated = await updateProject(id, { name: editName.trim(), repoUrl: editRepoUrl.trim() });
      setItems((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      setEditId(null);
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Update failed"));
    } finally {
      setEditSaving(false);
    }
  }

  async function onDelete(item: Project) {
    if (!window.confirm(tr(T.projects.confirmDelete, lang))) return;
    setError(null);
    try {
      await deleteProject(item._id);
      setItems((prev) => prev.filter((p) => p._id !== item._id));
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Delete failed"));
    }
  }

  const p = T.projects;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{tr(p.title, lang)}</h1>
        <p className="text-sm text-gray-600 mt-1">{tr(p.subtitle, lang)}</p>
      </div>

      <form onSubmit={onCreate} className="bg-white border rounded-2xl p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <div className="text-xs text-gray-600 mb-1">{tr(p.projectName, lang)}</div>
            <input
              className="w-full border rounded-lg px-3 py-2"
              placeholder={tr(p.namePlaceholder, lang)}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <div className="text-xs text-gray-600 mb-1">{tr(p.repoUrl, lang)}</div>
            <input
              className="w-full border rounded-lg px-3 py-2"
              placeholder="https://github.com/facebook/react"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
            />
          </div>
        </div>
        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
        <div className="mt-4 flex items-center gap-3">
          <button
            disabled={saving}
            className="rounded-lg bg-black text-white px-4 py-2 text-sm disabled:opacity-60"
          >
            {saving ? tr(p.creating, lang) : tr(p.createProject, lang)}
          </button>
          <button
            type="button"
            onClick={refresh}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
          >
            {tr(p.refresh, lang)}
          </button>
        </div>
      </form>

      <div className="bg-white border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b font-medium">
          {tr(p.list, lang)} ({items.length})
        </div>

        {loading ? (
          <div className="p-4 text-sm text-gray-600">{tr(p.loading, lang)}</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-sm text-gray-600">{tr(p.noProjects, lang)}</div>
        ) : (
          <div className="divide-y">
            {items.map((item) =>
              editId === item._id ? (
                // --- Inline edit form ---
                <div key={item._id} className="p-4 bg-blue-50 space-y-2">
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder={tr(p.projectName, lang)}
                  />
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
                    value={editRepoUrl}
                    onChange={(e) => setEditRepoUrl(e.target.value)}
                    placeholder="Repo URL"
                  />
                  {error && <div className="text-xs text-red-600">{error}</div>}
                  <div className="flex gap-2">
                    <button
                      disabled={editSaving}
                      onClick={() => onSaveEdit(item._id)}
                      className="rounded-lg bg-black text-white px-3 py-1.5 text-xs disabled:opacity-60"
                    >
                      {editSaving ? tr(p.saving, lang) : tr(p.save, lang)}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50"
                    >
                      {tr(p.cancel, lang)}
                    </button>
                  </div>
                </div>
              ) : (
                // --- Normal row ---
                <div key={item._id} className="p-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-600 break-all">{item.repoUrl}</div>
                    <div className="text-xs text-gray-400 mt-0.5">id: {item._id}</div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => startEdit(item)}
                      className="rounded-lg border px-2.5 py-1 text-xs hover:bg-gray-50"
                    >
                      {tr(p.edit, lang)}
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => onDelete(item)}
                        className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        {tr(p.delete, lang)}
                      </button>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

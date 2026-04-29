import React from "react";
import { createProject, listProjects } from "../lib/projects";
import type { Project } from "../lib/projects";
import { toErrorMessage } from "../lib/errorMessage";
import { useLang } from "../app/LanguageContext";
import { translations as T, tr } from "../lib/translations";

export function ProjectsPage() {
  const { lang } = useLang();
  const [items, setItems] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [name, setName] = React.useState("");
  const [repoUrl, setRepoUrl] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const data = await listProjects();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    refresh();
  }, []);

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
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-medium">{tr(p.list, lang)} ({items.length})</div>
        </div>

        {loading ? (
          <div className="p-4 text-sm text-gray-600">{tr(p.loading, lang)}</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-sm text-gray-600">{tr(p.noProjects, lang)}</div>
        ) : (
          <div className="divide-y">
            {items.map((item) => (
              <div key={item._id} className="p-4">
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-gray-600 break-all">{item.repoUrl}</div>
                <div className="text-xs text-gray-500 mt-1">id: {item._id}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

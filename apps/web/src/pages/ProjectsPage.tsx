import React from "react";
import { createProject, listProjects } from "../lib/projects";
import type { Project } from "../lib/projects";

export function ProjectsPage() {
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
      if (!name.trim()) throw new Error("Tên project không được rỗng");
      if (!repoUrl.trim()) throw new Error("Repo URL không được rỗng");

      await createProject({ name: name.trim(), repoUrl: repoUrl.trim() });
      setName("");
      setRepoUrl("");
      await refresh();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? err?.message ?? "Create failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Projects</h1>
        <p className="text-sm text-gray-600 mt-1">Tạo project bằng repo URL để chạy đánh giá.</p>
      </div>

      {/* Create form */}
      <form onSubmit={onCreate} className="bg-white border rounded-2xl p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <div className="text-xs text-gray-600 mb-1">Tên project</div>
            <input
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Demo Project"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <div className="text-xs text-gray-600 mb-1">Repo URL</div>
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
            {saving ? "Creating..." : "Create project"}
          </button>

          <button
            type="button"
            onClick={refresh}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </form>

      {/* List */}
      <div className="bg-white border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-medium">Danh sách ({items.length})</div>
        </div>

        {loading ? (
          <div className="p-4 text-sm text-gray-600">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-sm text-gray-600">Chưa có project nào.</div>
        ) : (
          <div className="divide-y">
            {items.map((p) => (
              <div key={p._id} className="p-4">
                <div className="font-medium">{p.name}</div>
                <div className="text-sm text-gray-600 break-all">{p.repoUrl}</div>
                <div className="text-xs text-gray-500 mt-1">id: {p._id}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
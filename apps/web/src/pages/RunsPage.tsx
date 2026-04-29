import React from "react";
import { useNavigate } from "react-router-dom";
import { listProjects, type Project } from "../lib/projects";
import { createRun, getRun, listRuns, type Run, type RunStatus } from "../lib/runs";
import { toErrorMessage } from "../lib/errorMessage";
import { useLang } from "../app/LanguageContext";
import { translations as T, tr } from "../lib/translations";

const LAST_RUN_KEY = "fairgit:lastRunId";

export function RunsPage() {
  const nav = useNavigate();
  const { lang } = useLang();

  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = React.useState(true);
  const [loadingRuns, setLoadingRuns] = React.useState(true);

  const [projectId, setProjectId] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<RunStatus | "all">("all");
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [activeRun, setActiveRun] = React.useState<Run | null>(null);
  const [runs, setRuns] = React.useState<Run[]>([]);

  const selectedProject = projects.find((p) => p._id === projectId);

  const loadProjects = React.useCallback(async () => {
    setLoadingProjects(true);
    try {
      const data = await listProjects();
      setProjects(data);
      if (!projectId && data.length > 0) {
        setProjectId(data[0]._id);
      }
    } finally {
      setLoadingProjects(false);
    }
  }, [projectId]);

  const loadRuns = React.useCallback(
    async (opts?: { keepActiveRun?: boolean }) => {
      setLoadingRuns(true);
      try {
        const res = await listRuns({
          projectId: projectId || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
          limit: 30,
          offset: 0,
        });
        setRuns(res.items);

        if (opts?.keepActiveRun) return;

        const lastRunId = localStorage.getItem(LAST_RUN_KEY);
        const preferred = res.items.find((r) => r._id === lastRunId);
        const fallback = res.items.find((r) => r.status === "running" || r.status === "pending") ?? res.items[0] ?? null;
        setActiveRun(preferred ?? fallback ?? null);
      } finally {
        setLoadingRuns(false);
      }
    },
    [projectId, statusFilter]
  );

  React.useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  React.useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  // Poll active run để cập nhật tiến độ realtime.
  React.useEffect(() => {
    if (!activeRun) return;
    if (activeRun.status !== "pending" && activeRun.status !== "running") return;

    const timer = setInterval(async () => {
      try {
        const fresh = await getRun(activeRun._id);
        setActiveRun(fresh);
        setRuns((prev) => prev.map((r) => (r._id === fresh._id ? fresh : r)));
      } catch {
        // ignore poll noise
      }
    }, 2000);

    return () => clearInterval(timer);
  }, [activeRun]);

  async function onRun() {
    setError(null);
    setCreating(true);
    try {
      if (!projectId) throw new Error(tr(T.runs.selectProjectFirst, lang));
      const run = await createRun(projectId);
      setActiveRun(run);
      localStorage.setItem(LAST_RUN_KEY, run._id);
      await loadRuns({ keepActiveRun: true });
      setRuns((prev) => {
        const exists = prev.some((x) => x._id === run._id);
        if (exists) return prev.map((x) => (x._id === run._id ? run : x));
        return [run, ...prev].slice(0, 30);
      });
    } catch (e: unknown) {
      setError(toErrorMessage(e, "Create run failed"));
    } finally {
      setCreating(false);
    }
  }

  function pickRun(run: Run) {
    setActiveRun(run);
    localStorage.setItem(LAST_RUN_KEY, run._id);
  }

  const ru = T.runs;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{tr(ru.title, lang)}</h1>
        <p className="text-sm text-gray-600 mt-1">{tr(ru.subtitle, lang)}</p>
      </div>

      <div className="bg-white border rounded-2xl p-4 space-y-4">
        <div className="grid gap-3 lg:grid-cols-6">
          <div className="lg:col-span-3">
            <div className="text-xs text-gray-600 mb-1">{tr(ru.project, lang)}</div>
            {loadingProjects ? (
              <div className="text-sm text-gray-600">{tr(ru.loadingProjects, lang)}</div>
            ) : (
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="text-xs text-gray-600 mb-1">{tr(ru.statusFilter, lang)}</div>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RunStatus | "all")}
            >
              <option value="all">{tr(ru.all, lang)}</option>
              <option value="pending">{tr(ru.pending, lang)}</option>
              <option value="running">{tr(ru.running, lang)}</option>
              <option value="done">{tr(ru.done, lang)}</option>
              <option value="failed">{tr(ru.failed, lang)}</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => void loadRuns()}
              className="w-full rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
            >
              {tr(ru.refresh, lang)}
            </button>
          </div>
        </div>

        <div className="text-xs text-gray-600 break-all">
          repo: <span className="font-mono">{selectedProject?.repoUrl ?? "-"}</span>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="flex items-center gap-3">
          <button
            disabled={creating || !projectId}
            onClick={onRun}
            className="rounded-lg bg-black text-white px-4 py-2 text-sm disabled:opacity-60"
          >
            {creating ? tr(ru.starting, lang) : tr(ru.runAnalysis, lang)}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 bg-white border rounded-2xl p-4">
          <div className="font-medium">{tr(ru.runDetail, lang)}</div>
          {!activeRun ? (
            <div className="mt-2 text-sm text-gray-600">{tr(ru.selectRun, lang)}</div>
          ) : (
            <div className="mt-3 space-y-3 text-sm">
              <div>
                <span className="text-gray-600">runId:</span>{" "}
                <span className="font-mono break-all">{activeRun._id}</span>
              </div>
              <div>
                <span className="text-gray-600">status:</span> <StatusBadge status={activeRun.status} />
              </div>
              <div className="text-gray-600">
                progress: {activeRun.progress ?? (activeRun.status === "done" ? 100 : 0)}%
              </div>
              <ProgressBar value={activeRun.progress ?? (activeRun.status === "done" ? 100 : 0)} />

              <div className="text-gray-600">
                commits: {activeRun.totalCommits ?? "-"} • contributors: {activeRun.totalContributors ?? "-"}
              </div>

              <div className="text-gray-600">
                updatedAt: {new Date(activeRun.updatedAt).toLocaleString()}
              </div>

              {activeRun.error && (
                <div className="text-red-600 whitespace-pre-wrap">
                  <span className="text-gray-600">error:</span> {activeRun.error}
                </div>
              )}

              {activeRun.status === "done" && (
                <button
                  className="mt-2 rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
                  onClick={() => nav(`/results?runId=${activeRun._id}`)}
                >
                  {tr(ru.viewResults, lang)}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="font-medium">{tr(ru.recentRuns, lang)}</div>
            <div className="text-xs text-gray-500">{runs.length} {tr(T.common.items, lang)}</div>
          </div>

          {loadingRuns ? (
            <div className="p-4 text-sm text-gray-600">{tr(ru.loadingRuns, lang)}</div>
          ) : runs.length === 0 ? (
            <div className="p-4 text-sm text-gray-600">{tr(ru.noRuns, lang)}</div>
          ) : (
            <div className="divide-y">
              {runs.map((r) => (
                <button
                  key={r._id}
                  type="button"
                  onClick={() => pickRun(r)}
                  className={`w-full text-left p-4 hover:bg-gray-50 ${
                    activeRun?._id === r._id ? "bg-gray-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-mono text-xs break-all">{r._id}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {new Date(r.createdAt).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        progress: {r.progress ?? (r.status === "done" ? 100 : 0)}% • commits: {r.totalCommits ?? "-"} • contributors:{" "}
                        {r.totalContributors ?? "-"}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <StatusBadge status={r.status} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Run["status"] }) {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs border";
  if (status === "done") return <span className={`${base} bg-green-50 border-green-200`}>done</span>;
  if (status === "failed") return <span className={`${base} bg-red-50 border-red-200`}>failed</span>;
  if (status === "running") return <span className={`${base} bg-blue-50 border-blue-200`}>running</span>;
  return <span className={`${base} bg-gray-50 border-gray-200`}>pending</span>;
}

function ProgressBar({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
      <div className="h-2 bg-black transition-all duration-300" style={{ width: `${safe}%` }} />
    </div>
  );
}

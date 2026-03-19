import React from "react";
import { useNavigate } from "react-router-dom";
import { listProjects, type Project } from "../lib/projects";
import { createRun, getRun, type Run } from "../lib/runs";

const LAST_RUN_KEY = "fairgit:lastRunId";

export function RunsPage() {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = React.useState(true);

  const [projectId, setProjectId] = React.useState<string>("");
  const [creating, setCreating] = React.useState(false);

  const [run, setRun] = React.useState<Run | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const nav = useNavigate();

  async function loadProjects() {
    setLoadingProjects(true);
    try {
      const ps = await listProjects();
      setProjects(ps);
      if (!projectId && ps.length > 0) setProjectId(ps[0]._id);
    } finally {
      setLoadingProjects(false);
    }
  }

  // load projects + restore last run
  React.useEffect(() => {
    loadProjects();

    const lastRunId = localStorage.getItem(LAST_RUN_KEY);
    if (lastRunId) {
      getRun(lastRunId)
        .then((r) => setRun(r))
        .catch(() => {
          // nếu runId cũ không còn hợp lệ thì xóa cho sạch
          localStorage.removeItem(LAST_RUN_KEY);
        });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // poll run status nếu đang running/pending
  React.useEffect(() => {
    if (!run) return;
    if (run.status !== "pending" && run.status !== "running") return;

    const t = setInterval(async () => {
      try {
        const fresh = await getRun(run._id);
        setRun(fresh);
      } catch {}
    }, 2000);

    return () => clearInterval(t);
  }, [run]);

  async function onRun() {
    setError(null);
    setCreating(true);
    try {
      if (!projectId) throw new Error("Chọn project trước");
      const r = await createRun(projectId);
      setRun(r);

      // ✅ nhớ run gần nhất để quay lại tab vẫn còn
      localStorage.setItem(LAST_RUN_KEY, r._id);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e?.message ?? "Create run failed");
    } finally {
      setCreating(false);
    }
  }

  function clearLastRun() {
    localStorage.removeItem(LAST_RUN_KEY);
    setRun(null);
  }

  const selectedProject = projects.find((p) => p._id === projectId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Runs</h1>
        <p className="text-sm text-gray-600 mt-1">Chạy phân tích (analysis) cho 1 project.</p>
      </div>

      <div className="bg-white border rounded-2xl p-4 space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="text-xs text-gray-600 mb-1">Chọn project</div>
            {loadingProjects ? (
              <div className="text-sm text-gray-600">Loading projects...</div>
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

          <div>
            <div className="text-xs text-gray-600 mb-1">Repo</div>
            <div className="text-sm text-gray-800 break-all border rounded-lg px-3 py-2 bg-gray-50">
              {selectedProject?.repoUrl ?? "-"}
            </div>
          </div>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="flex items-center gap-3">
          <button
            disabled={creating || !projectId}
            onClick={onRun}
            className="rounded-lg bg-black text-white px-4 py-2 text-sm disabled:opacity-60"
          >
            {creating ? "Starting..." : "Run analysis"}
          </button>

          <button
            type="button"
            onClick={loadProjects}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Refresh projects
          </button>
        </div>
      </div>

      {/* Run status card */}
      <div className="bg-white border rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div className="font-medium">Run status</div>

          {run && (
            <button
              className="text-sm underline text-gray-600"
              onClick={clearLastRun}
              title="Xóa run đang hiển thị"
            >
              Clear
            </button>
          )}
        </div>

        {!run ? (
          <div className="text-sm text-gray-600 mt-2">
            Chưa có run nào. Bấm “Run analysis”.
          </div>
        ) : (
          <div className="mt-3 space-y-2 text-sm">
            <div>
              <span className="text-gray-600">runId:</span>{" "}
              <span className="font-mono">{run._id}</span>
            </div>

            <div>
              <span className="text-gray-600">status:</span>{" "}
              <StatusBadge status={run.status} />
            </div>

            {run.error && (
              <div className="text-red-600 whitespace-pre-wrap">
                <span className="text-gray-600">error:</span> {run.error}
              </div>
            )}

            <div className="text-gray-600">
              updatedAt: {new Date(run.updatedAt).toLocaleString()}
            </div>

            {run.status === "done" && (
              <button
                className="mt-3 rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
                onClick={() => nav(`/results?runId=${run._id}`)}
              >
                View results
              </button>
            )}
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500">
        Tip: Khi status = <b>done</b>, sang tab <b>Results</b> để xem leaderboard.
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
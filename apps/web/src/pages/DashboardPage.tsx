import React from "react";
import { getDashboardSummary, type DashboardSummary } from "../lib/dashboard";
import { useNavigate } from "react-router-dom";
import { copyText } from "../lib/clipboard";

export function DashboardPage() {
  const nav = useNavigate();
  const [data, setData] = React.useState<DashboardSummary | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const d = await getDashboardSummary();
      setData(d);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e?.message ?? "Request failed");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  const latest = data?.latestRun ?? null;
  const statusCounts = data?.statusCounts ?? { pending: 0, running: 0, done: 0, failed: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Tổng quan dự án + run mới nhất + top contributors.</p>
        </div>

        <button
          onClick={load}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-6">
        <StatCard label="Projects" value={data?.projectsCount ?? 0} />
        <StatCard label="Runs" value={data?.runsCount ?? 0} />
        <StatCard label="Pending" value={statusCounts.pending} />
        <StatCard label="Running" value={statusCounts.running} />
        <StatCard label="Done" value={statusCounts.done} />
        <StatCard label="Failed" value={statusCounts.failed} />
      </div>

      {/* Latest run + Top contributors */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white border rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="font-medium">Latest run</div>
            <div className="text-xs text-gray-500">{latest ? latest.status : "No runs yet"}</div>
          </div>

          {!latest ? (
            <div className="mt-3 text-sm text-gray-600">
              Chưa có run nào. Vào tab <b>Runs</b> để bấm “Run analysis”.
            </div>
          ) : (
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-gray-600">runId:</span>{" "}
                  <span className="font-mono">{latest._id}</span>
                </div>
                <button
                  className="text-xs underline text-gray-600"
                  onClick={() => copyText(latest._id)}
                >
                  copy
                </button>
              </div>

              <div>
                <span className="text-gray-600">status:</span> <StatusBadge status={latest.status} />
              </div>

              <div className="text-gray-600">
                updatedAt: {new Date(latest.updatedAt).toLocaleString()}
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  className="rounded-lg bg-black text-white px-3 py-2 text-sm"
                  onClick={() => nav(`/results?runId=${latest._id}`)}
                  disabled={latest.status !== "done"}
                  title={latest.status !== "done" ? "Run chưa done" : "Xem Results"}
                >
                  View results
                </button>

                <button
                  className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                  onClick={() => nav("/runs")}
                >
                  Go to Runs
                </button>
              </div>

              {latest.error && (
                <div className="text-red-600 whitespace-pre-wrap">
                  <span className="text-gray-600">error:</span> {latest.error}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white border rounded-2xl overflow-hidden">
          <div className="p-4 border-b">
            <div className="font-medium">Top contributors</div>
            <div className="text-xs text-gray-500 mt-1">
              {latest?.status === "done" ? "Theo latest run." : "Chỉ hiện khi latest run = done."}
            </div>
          </div>

          {(!latest || latest.status !== "done") ? (
            <div className="p-4 text-sm text-gray-600">Chưa có leaderboard.</div>
          ) : (
            <div className="divide-y">
              {(data?.topContributors ?? []).map((r, i) => (
                <div key={r._id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-gray-500">#{i + 1}</div>
                      <div className="font-medium">{r.authorName}</div>
                      <div className="text-xs text-gray-600 break-all">{r.authorEmail}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        commits: {r.commitCount} • core: {r.coreTouches} • noise: {r.noiseTouches}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-semibold">{r.scoreTotal}</div>
                      <div className="text-xs text-gray-500">/100</div>
                    </div>
                  </div>
                </div>
              ))}
              {(data?.topContributors?.length ?? 0) === 0 && (
                <div className="p-4 text-sm text-gray-600">Run done nhưng chưa có results.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border rounded-2xl p-4">
      <div className="text-xs text-gray-600">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: "pending" | "running" | "done" | "failed" }) {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs border";
  if (status === "done") return <span className={`${base} bg-green-50 border-green-200`}>done</span>;
  if (status === "failed") return <span className={`${base} bg-red-50 border-red-200`}>failed</span>;
  if (status === "running") return <span className={`${base} bg-blue-50 border-blue-200`}>running</span>;
  return <span className={`${base} bg-gray-50 border-gray-200`}>pending</span>;
}
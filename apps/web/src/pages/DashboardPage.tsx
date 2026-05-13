import React from "react";
import { useNavigate } from "react-router-dom";
import { copyText } from "../lib/clipboard";
import { getDashboardSummary, type DashboardSummary } from "../lib/dashboard";
import { toErrorMessage } from "../lib/errorMessage";
import { useAuth } from "../app/AuthProvider";
import { useLang } from "../app/LanguageContext";
import { translations as T, tr } from "../lib/translations";

export function DashboardPage() {
  const nav = useNavigate();
  const { lang } = useLang();
  const { state } = useAuth();
  const canManageRuns = state.status === "authed" && (state.role === "admin" || state.role === "manager");
  const [data, setData] = React.useState<DashboardSummary | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const d = await getDashboardSummary();
      setData(d);
    } catch (e: unknown) {
      setError(toErrorMessage(e, "Request failed"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  const latestRun = data?.latestRun ?? null;
  const latestDoneRun = data?.latestDoneRun ?? null;
  const statusCounts = data?.statusCounts ?? { pending: 0, running: 0, done: 0, failed: 0 };
  const avgConfidence =
    data?.topContributors?.length
      ? Math.round(
          data.topContributors.reduce((sum, x) => sum + (x.scoreConfidence ?? 0), 0) / data.topContributors.length
        )
      : 0;

  const d = T.dashboard;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{tr(d.title, lang)}</h1>
          <p className="text-sm text-gray-600 mt-1">{tr(d.subtitle, lang)}</p>
        </div>

        <button
          onClick={load}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? tr(d.refreshing, lang) : tr(d.refresh, lang)}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-7">
        <StatCard label={tr(d.statProjects, lang)}   value={data?.projectsCount ?? 0} />
        <StatCard label={tr(d.statRuns, lang)}        value={data?.runsCount ?? 0} />
        <StatCard label={tr(d.statPending, lang)}     value={statusCounts.pending} />
        <StatCard label={tr(d.statRunning, lang)}     value={statusCounts.running} />
        <StatCard label={tr(d.statDone, lang)}        value={statusCounts.done} />
        <StatCard label={tr(d.statFailed, lang)}      value={statusCounts.failed} />
        <StatCard label={tr(d.statAvgConf, lang)}     value={avgConfidence} suffix="/100" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white border rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="font-medium">{tr(d.latestRun, lang)}</div>
            <div className="text-xs text-gray-500">{latestRun ? latestRun.status : tr(d.noRunsYet, lang)}</div>
          </div>

          {!latestRun ? (
            <div className="mt-3 text-sm text-gray-600">
              {tr(d.noRunsMsg, lang)}
            </div>
          ) : (
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-gray-600">runId:</span>{" "}
                  <span className="font-mono">{latestRun._id}</span>
                </div>
                <button className="text-xs underline text-gray-600" onClick={() => copyText(latestRun._id)}>
                  {tr(T.common.copy, lang)}
                </button>
              </div>

              <div>
                <span className="text-gray-600">status:</span> <StatusBadge status={latestRun.status} />
              </div>

              <div className="text-gray-600">progress: {latestRun.progress ?? (latestRun.status === "done" ? 100 : 0)}%</div>
              <ProgressBar value={latestRun.progress ?? (latestRun.status === "done" ? 100 : 0)} />

              <div className="text-gray-600">updatedAt: {new Date(latestRun.updatedAt).toLocaleString()}</div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  className="rounded-lg bg-black text-white px-3 py-2 text-sm"
                  onClick={() => nav(`/results?runId=${latestRun._id}`)}
                  disabled={latestRun.status !== "done"}
                  title={latestRun.status !== "done" ? tr(d.runNotDone, lang) : tr(d.viewResults, lang)}
                >
                  {tr(d.viewResults, lang)}
                </button>

                {canManageRuns && (
                  <button className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50" onClick={() => nav("/runs")}>
                    {tr(d.goToRuns, lang)}
                  </button>
                )}
              </div>

              {latestRun.error && (
                <div className="text-red-600 whitespace-pre-wrap">
                  <span className="text-gray-600">error:</span> {latestRun.error}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white border rounded-2xl overflow-hidden">
          <div className="p-4 border-b">
            <div className="font-medium">{tr(d.topContributors, lang)}</div>
            <div className="text-xs text-gray-500 mt-1">
              {tr(d.byRun, lang)} <span className="font-mono">{latestDoneRun?._id ?? "N/A"}</span>
            </div>
          </div>

          {!latestDoneRun ? (
            <div className="p-4 text-sm text-gray-600">{tr(d.noRunDone, lang)}</div>
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
                      <div className="text-xs text-gray-500 mt-1">confidence: {r.scoreConfidence ?? 0}/100</div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-semibold">{r.scoreTotal}</div>
                      <div className="text-xs text-gray-500">/100</div>
                    </div>
                  </div>
                </div>
              ))}
              {(data?.topContributors?.length ?? 0) === 0 && (
                <div className="p-4 text-sm text-gray-600">{tr(d.runDoneNoResults, lang)}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="bg-white border rounded-2xl p-4">
      <div className="text-xs text-gray-600">{label}</div>
      <div className="text-2xl font-semibold mt-1">
        {value}
        {suffix}
      </div>
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

function ProgressBar({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
      <div className="h-2 bg-black transition-all duration-300" style={{ width: `${safe}%` }} />
    </div>
  );
}

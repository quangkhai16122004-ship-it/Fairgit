import React from "react";
import { useSearchParams } from "react-router-dom";
import { copyText } from "../lib/clipboard";
import { getResults, type ResultRow } from "../lib/results";
import { toErrorMessage } from "../lib/errorMessage";
import { useLang } from "../app/LanguageContext";
import { translations as T, tr, type Lang } from "../lib/translations";

const PAGE_SIZE = 50;

export function ResultsPage() {
  const { lang } = useLang();
  const [runId, setRunId] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<ResultRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [offset, setOffset] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<ResultRow | null>(null);

  const [q, setQ] = React.useState("");
  const [sortBy, setSortBy] = React.useState<
    "scoreTotal" | "scoreImpact" | "scoreConsistency" | "scoreClean" | "scoreConfidence" | "commitCount"
  >("scoreTotal");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");

  const [sp] = useSearchParams();

  const langRef = React.useRef(lang);
  React.useEffect(() => { langRef.current = lang; }, [lang]);

  const loadResults = React.useCallback(
    async (input: {
      rid: string;
      reset: boolean;
      nextOffset: number;
      q: string;
      sortBy: "scoreTotal" | "scoreImpact" | "scoreConsistency" | "scoreClean" | "scoreConfidence" | "commitCount";
      sortDir: "asc" | "desc";
    }) => {
      setLoading(true);
      setError(null);
      try {
        if (!input.rid.trim()) throw new Error(tr(T.results.enterRunId, langRef.current));

        const data = await getResults(input.rid.trim(), {
          limit: PAGE_SIZE,
          offset: input.nextOffset,
          q: input.q.trim() || undefined,
          sortBy: input.sortBy,
          sortDir: input.sortDir,
        });

        const normalized = data.items.map(normalizeResultRow);
        setTotal(data.total);
        setOffset(input.nextOffset + normalized.length);

        if (input.reset) {
          setItems(normalized);
          setSelected(normalized[0] ?? null);
        } else {
          setItems((prev) => [...prev, ...normalized]);
        }
      } catch (e: unknown) {
        setError(toErrorMessage(e, "Load failed"));
        if (input.reset) {
          setItems([]);
          setTotal(0);
          setOffset(0);
          setSelected(null);
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  React.useEffect(() => {
    const rid = sp.get("runId") ?? "";
    setRunId(rid);
    setItems([]);
    setTotal(0);
    setOffset(0);
    setSelected(null);
    setError(null);
    if (rid.trim()) {
      loadResults({
        rid,
        reset: true,
        nextOffset: 0,
        q: "",
        sortBy: "scoreTotal",
        sortDir: "desc",
      });
    }
  }, [sp, loadResults]);

  function onLoad() {
    void loadResults({
      rid: runId,
      reset: true,
      nextOffset: 0,
      q,
      sortBy,
      sortDir,
    });
  }

  function onLoadMore() {
    if (loading) return;
    if (items.length >= total) return;
    void loadResults({
      rid: runId,
      reset: false,
      nextOffset: offset,
      q,
      sortBy,
      sortDir,
    });
  }

  const canLoadMore = items.length < total;
  const res = T.results;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{tr(res.title, lang)}</h1>
        <p className="text-sm text-gray-600 mt-1">{tr(res.subtitle, lang)}</p>
      </div>

      <div className="bg-white border rounded-2xl p-4 space-y-3">
        <div className="grid gap-3 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="text-xs text-gray-600 mb-1">{tr(res.runIdLabel, lang)}</div>
            <input
              className="w-full border rounded-lg px-3 py-2 font-mono"
              placeholder={tr(res.runIdPlaceholder, lang)}
              value={runId}
              onChange={(e) => setRunId(e.target.value)}
            />
          </div>

          <div className="lg:col-span-3">
            <div className="text-xs text-gray-600 mb-1">{tr(res.searchLabel, lang)}</div>
            <input
              className="w-full border rounded-lg px-3 py-2"
              placeholder={tr(res.searchPlaceholder, lang)}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="lg:col-span-2">
            <div className="text-xs text-gray-600 mb-1">{tr(res.sortBy, lang)}</div>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            >
              <option value="scoreTotal">{tr(res.sortTotal, lang)}</option>
              <option value="scoreImpact">{tr(res.sortImpact, lang)}</option>
              <option value="scoreConsistency">{tr(res.sortConsistency, lang)}</option>
              <option value="scoreClean">{tr(res.sortFocus, lang)}</option>
              <option value="scoreConfidence">{tr(res.sortConfidence, lang)}</option>
              <option value="commitCount">{tr(res.sortCommits, lang)}</option>
            </select>
          </div>

          <div className="lg:col-span-1">
            <div className="text-xs text-gray-600 mb-1">{tr(res.dir, lang)}</div>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as "asc" | "desc")}
            >
              <option value="desc">{tr(res.desc, lang)}</option>
              <option value="asc">{tr(res.asc, lang)}</option>
            </select>
          </div>

          <div className="lg:col-span-2 flex items-end">
            <button
              onClick={onLoad}
              disabled={loading}
              className="w-full rounded-lg bg-black text-white px-4 py-2 text-sm disabled:opacity-60"
            >
              {loading ? tr(res.loading, lang) : tr(res.loadResults, lang)}
            </button>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          {tr(res.showing, lang)} {items.length} / {total} {tr(res.ofContributors, lang)}
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="font-medium">{tr(res.leaderboard, lang)}</div>
            <div className="text-xs text-gray-500">
              {sortBy} ({sortDir})
            </div>
          </div>

          {items.length === 0 ? (
            <div className="p-4 text-sm text-gray-600">{tr(res.noData, lang)}</div>
          ) : (
            <>
              <div className="divide-y">
                {items.map((r, idx) => (
                  <button
                    key={r._id}
                    onClick={() => setSelected(r)}
                    className={`w-full text-left p-4 hover:bg-gray-50 ${
                      selected?._id === r._id ? "bg-gray-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-8">#{idx + 1}</span>
                          <div className="font-medium">{r.authorName}</div>
                          <ConfidenceBadge value={r.scoreConfidence ?? 0} lang={lang} />
                        </div>
                        <div className="text-xs text-gray-600 break-all ml-10">{r.authorEmail}</div>
                        <div className="text-xs text-gray-500 ml-10 mt-1">
                          commits: {r.commitCount} • activeDays: {r.activeDays ?? 0} • spamPenalty: {r.spamPenalty ?? 0}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-2xl font-semibold">{r.scoreTotal}</div>
                        <div className="text-xs text-gray-500">/ 100</div>
                        <div className="mt-2 text-xs text-gray-600">
                          C:{r.scoreConsistency} I:{r.scoreImpact} F:{r.scoreClean}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {canLoadMore && (
                <div className="p-3 border-t">
                  <button
                    type="button"
                    onClick={onLoadMore}
                    disabled={loading}
                    className="w-full rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
                  >
                    {loading ? tr(res.loading, lang) : tr(res.loadMore, lang)}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="bg-white border rounded-2xl p-4">
          <div className="font-medium">{tr(res.detail, lang)}</div>

          {!selected ? (
            <div className="mt-2 text-sm text-gray-600">{tr(res.selectContributor, lang)}</div>
          ) : (
            <div className="mt-3 space-y-4">
              <div>
                <div className="font-medium">{selected.authorName}</div>
                <div className="text-xs text-gray-600 break-all">{selected.authorEmail}</div>
                <div className="text-xs text-gray-500 mt-1 font-mono">runId: {selected.runId}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <MiniStat label={tr(res.sortTotal, lang)}      value={selected.scoreTotal} />
                <MiniStat label={tr(res.sortImpact, lang)}     value={selected.scoreImpact} />
                <MiniStat label={tr(res.sortFocus, lang)}      value={selected.scoreClean} />
                <MiniStat label={tr(res.sortConfidence, lang)} value={selected.scoreConfidence ?? 0} />
              </div>

              <ExplainScore selected={selected} lang={lang} />

              <div>
                <div className="text-sm font-medium">{tr(res.topCommits, lang)}</div>
                <div className="mt-2 space-y-2">
                  {selected.evidenceCommits?.length ? (
                    selected.evidenceCommits.map((c) => (
                      <div key={c.hash} className="border rounded-lg p-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-mono text-xs break-all">{c.hash}</div>
                          <button
                            className="text-xs underline text-gray-600 shrink-0"
                            onClick={() => copyText(c.hash)}
                          >
                            {tr(T.common.copy, lang)}
                          </button>
                        </div>

                        {c.subject && <div className="text-xs text-gray-700 mt-1">{c.subject}</div>}
                        <div className="text-xs text-gray-600 mt-1">
                          coreFiles: {c.coreFiles} • noiseFiles: {c.noiseFiles} • totalFiles: {c.totalFiles} • changedLines:{" "}
                          {c.changedLines ?? 0}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-600">{tr(res.noEvidence, lang)}</div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium">{tr(res.topFiles, lang)}</div>
                <div className="mt-2 space-y-2">
                  {selected.topFiles?.length ? (
                    selected.topFiles.map((f) => (
                      <div key={f.path} className="border rounded-lg p-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-xs break-all">{f.path}</div>
                          <button
                            className="text-xs underline text-gray-600 shrink-0"
                            onClick={() => copyText(f.path)}
                          >
                            {tr(T.common.copy, lang)}
                          </button>
                        </div>
                        <div className="text-xs text-gray-600 mt-1 flex items-center gap-2 flex-wrap">
                          <span>touches: {f.touches}</span>
                          <span>•</span>
                          <span>changedLines: {f.changedLines ?? 0}</span>
                          <span>•</span>
                          <TagBadge tag={f.tag} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-600">{tr(res.noTopFiles, lang)}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function normalizeResultRow(row: ResultRow): ResultRow {
  return {
    ...row,
    testTouches: row.testTouches ?? 0,
    docTouches: row.docTouches ?? 0,
    otherTouches: row.otherTouches ?? 0,
    scoreConfidence: row.scoreConfidence ?? 0,
    spamPenalty: row.spamPenalty ?? 0,
    activeDays: row.activeDays ?? 0,
    activeWeeks: row.activeWeeks ?? 0,
    tinyCommitCount: row.tinyCommitCount ?? 0,
    impactRaw: row.impactRaw ?? 0,
    totalTouches:
      row.totalTouches ??
      row.coreTouches +
        (row.testTouches ?? 0) +
        (row.docTouches ?? 0) +
        (row.otherTouches ?? 0) +
        row.noiseTouches,
    evidenceCommits: row.evidenceCommits ?? [],
    topFiles: row.topFiles ?? [],
  };
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border rounded-xl p-2 bg-gray-50">
      <div className="text-xs text-gray-600">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function TagBadge({ tag }: { tag: string }) {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs border font-mono";
  if (tag === "core") return <span className={`${base} bg-green-50 border-green-200`}>core</span>;
  if (tag === "test") return <span className={`${base} bg-blue-50 border-blue-200`}>test</span>;
  if (tag === "noise") return <span className={`${base} bg-red-50 border-red-200`}>noise</span>;
  if (tag === "doc") return <span className={`${base} bg-yellow-50 border-yellow-200`}>doc</span>;
  return <span className={`${base} bg-gray-50 border-gray-200`}>{tag}</span>;
}

function ConfidenceBadge({ value, lang }: { value: number; lang: Lang }) {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs border";
  if (value >= 70)
    return <span className={`${base} bg-green-50 border-green-200`}>{tr(T.results.highConf, lang)}</span>;
  if (value >= 40)
    return <span className={`${base} bg-yellow-50 border-yellow-200`}>{tr(T.results.medConf, lang)}</span>;
  return <span className={`${base} bg-red-50 border-red-200`}>{tr(T.results.lowConf, lang)}</span>;
}

function ExplainScore({ selected, lang }: { selected: ResultRow; lang: Lang }) {
  const testTouches = selected.testTouches ?? 0;
  const docTouches = selected.docTouches ?? 0;
  const otherTouches = selected.otherTouches ?? 0;
  const totalTouches =
    selected.totalTouches ??
    selected.coreTouches +
      testTouches +
      docTouches +
      otherTouches +
      selected.noiseTouches;

  const coreRatio = totalTouches > 0 ? selected.coreTouches / totalTouches : 0;
  const corePct = Math.round(coreRatio * 100);
  const cPct = Math.min(100, Math.round((selected.scoreConsistency / 30) * 100));
  const iPct = Math.min(100, Math.round((selected.scoreImpact / 50) * 100));
  const fPct = Math.min(100, Math.round((selected.scoreClean / 20) * 100));

  const res = T.results;

  return (
    <div className="border rounded-2xl p-3 bg-gray-50">
      <div className="text-sm font-medium">{tr(res.explainScore, lang)}</div>
      <div className="text-xs text-gray-600 mt-1">{tr(res.explainText, lang)}</div>

      <div className="mt-3 space-y-3">
        <ExplainRow title={`Consistency: ${selected.scoreConsistency}/30`} percent={cPct} meta={`activeDays: ${selected.activeDays ?? 0} • activeWeeks: ${selected.activeWeeks ?? 0}`} />
        <ExplainRow title={`Impact: ${selected.scoreImpact}/50`} percent={iPct} meta={`impactRaw: ${(selected.impactRaw ?? 0).toFixed(2)} • coreTouches: ${selected.coreTouches}`} />
        <ExplainRow title={`Focus: ${selected.scoreClean}/20`} percent={fPct} meta={`coreRatio: ${corePct}% • spamPenalty: ${selected.spamPenalty ?? 0} • tinyCommits: ${selected.tinyCommitCount ?? 0}`} />
        <ExplainRow title={`Confidence: ${selected.scoreConfidence ?? 0}/100`} percent={Math.min(100, selected.scoreConfidence ?? 0)} meta={`commitCount: ${selected.commitCount} • totalTouches: ${totalTouches}`} />
      </div>
    </div>
  );
}

function ExplainRow({ title, percent, meta }: { title: string; percent: number; meta: string }) {
  return (
    <div className="bg-white border rounded-xl p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{title}</div>
          <div className="text-xs text-gray-500 mt-1">{meta}</div>
        </div>
        <div className="text-xs text-gray-500">{percent}%</div>
      </div>
      <div className="mt-2 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className="h-2 bg-black" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

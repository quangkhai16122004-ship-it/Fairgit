import React from "react";
import { getResults, type ResultRow } from "../lib/results";
import { copyText } from "../lib/clipboard";
import { useSearchParams } from "react-router-dom";

export function ResultsPage() {
  const [runId, setRunId] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<ResultRow[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<ResultRow | null>(null);
  const [q, setQ] = React.useState("");

  const [sp] = useSearchParams();

  const loadResults = React.useCallback(async (rid: string) => {
    setLoading(true);
    setError(null);
    setSelected(null);

    try {
      if (!rid.trim()) throw new Error("Nhập runId trước");
      const data = (await getResults(rid.trim())).map(normalizeResultRow);
      setItems(data);
      setSelected(data[0] ?? null);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e?.message ?? "Load failed");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const rid = sp.get("runId") ?? "";

    setRunId(rid);
    setSelected(null);
    setItems([]);
    setError(null);

    if (rid.trim()) {
      loadResults(rid);
    }
  }, [sp, loadResults]);

  const filtered = items.filter((r) => {
    const s = (r.authorName + " " + r.authorEmail).toLowerCase();
    return s.includes(q.trim().toLowerCase());
  });

  async function onLoad() {
    await loadResults(runId);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Results</h1>
        <p className="text-sm text-gray-600 mt-1">
          Nhập runId để xem bảng xếp hạng + bằng chứng.
        </p>
      </div>

      <div className="bg-white border rounded-2xl p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-3">
            <div className="text-xs text-gray-600 mb-1">runId</div>
            <input
              className="w-full border rounded-lg px-3 py-2 font-mono"
              placeholder="Ví dụ: 69a4f7f252717f05aed0c633"
              value={runId}
              onChange={(e) => setRunId(e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={onLoad}
              disabled={loading}
              className="w-full rounded-lg bg-black text-white px-4 py-2 text-sm disabled:opacity-60"
            >
              {loading ? "Loading..." : "Load results"}
            </button>
          </div>
        </div>

        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between gap-3">
            <div className="font-medium">Leaderboard</div>

            <div className="flex items-center gap-3">
              <input
                className="border rounded-lg px-3 py-1 text-sm"
                placeholder="Search name/email..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <div className="text-xs text-gray-500">
                {filtered.length} / {items.length}
              </div>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="p-4 text-sm text-gray-600">
              Chưa có dữ liệu. Nhập runId rồi Load.
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((r, idx) => (
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
                        <span className="text-xs text-gray-500 w-6">#{idx + 1}</span>
                        <div className="font-medium">{r.authorName}</div>
                      </div>

                      <div className="text-xs text-gray-600 break-all ml-8">
                        {r.authorEmail}
                      </div>

                      <div className="text-xs text-gray-500 ml-8 mt-1">
                        commits: {r.commitCount} • coreTouches: {r.coreTouches} • noise:{" "}
                        {r.noiseTouches}
                      </div>
                    </div>

                    <div className="text-right">
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
          )}
        </div>

        <div className="bg-white border rounded-2xl p-4">
          <div className="font-medium">Detail</div>

          {!selected ? (
            <div className="mt-2 text-sm text-gray-600">
              Chọn 1 người ở leaderboard để xem bằng chứng.
            </div>
          ) : (
            <div className="mt-3 space-y-4">
              <div>
                <div className="font-medium">{selected.authorName}</div>
                <div className="text-xs text-gray-600 break-all">
                  {selected.authorEmail}
                </div>
                <div className="text-xs text-gray-500 mt-1 font-mono">
                  runId: {selected.runId}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <MiniStat label="Total" value={selected.scoreTotal} />
                <MiniStat label="Impact" value={selected.scoreImpact} />
                <MiniStat label="Focus" value={selected.scoreClean} />
              </div>

              <ExplainScore selected={selected} />

              <div>
                <div className="text-sm font-medium">Top commits (evidence)</div>
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
                            copy
                          </button>
                        </div>

                        <div className="text-xs text-gray-600 mt-1">
                          coreFiles: {c.coreFiles} • noiseFiles: {c.noiseFiles} • totalFiles:{" "}
                          {c.totalFiles}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-600">
                      Không có evidenceCommits.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium">Top files</div>
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
                            copy
                          </button>
                        </div>

                        <div className="text-xs text-gray-600 mt-1 flex items-center gap-2">
                          <span>touches: {f.touches}</span>
                          <span>•</span>
                          <TagBadge tag={f.tag} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-600">Không có topFiles.</div>
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

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border rounded-xl p-2 bg-gray-50">
      <div className="text-xs text-gray-600">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function TagBadge({ tag }: { tag: string }) {
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-xs border font-mono";

  if (tag === "core") {
    return <span className={`${base} bg-green-50 border-green-200`}>core</span>;
  }

  if (tag === "test") {
    return <span className={`${base} bg-blue-50 border-blue-200`}>test</span>;
  }

  if (tag === "noise") {
    return <span className={`${base} bg-red-50 border-red-200`}>noise</span>;
  }

  if (tag === "doc") {
    return <span className={`${base} bg-yellow-50 border-yellow-200`}>doc</span>;
  }

  return <span className={`${base} bg-gray-50 border-gray-200`}>{tag}</span>;
}

function normalizeResultRow(row: ResultRow): ResultRow {
  return {
    ...row,
    testTouches: row.testTouches ?? 0,
    docTouches: row.docTouches ?? 0,
    otherTouches: row.otherTouches ?? 0,
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

function ExplainScore({ selected }: { selected: ResultRow }) {
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

  const consistencyText =
    selected.scoreConsistency >= 20
      ? "Hoạt động khá đều theo thời gian (nhiều tuần có commit)."
      : selected.scoreConsistency >= 10
      ? "Có hoạt động nhưng chưa đều, có tuần trống."
      : "Hoạt động chưa đều hoặc ít tuần có commit.";

  const impactText =
    selected.coreTouches >= 100
      ? "Chạm nhiều file quan trọng (core) → tác động lớn."
      : selected.coreTouches >= 30
      ? "Có đóng góp vào file core nhưng mức độ vừa."
      : "Chạm file core ít, tác động chủ yếu nhỏ/lẻ.";

  const focusText =
    corePct >= 70
      ? "Tập trung rất mạnh vào core (tỷ lệ core cao)."
      : corePct >= 40
      ? "Tập trung vào core mức vừa (vẫn có test, tài liệu hoặc file phụ đáng kể)."
      : "Tỷ lệ core thấp → thay đổi rải nhiều ngoài core (focus thấp).";

  return (
    <div className="border rounded-2xl p-3 bg-gray-50">
      <div className="text-sm font-medium">Giải thích điểm (minh bạch)</div>
      <div className="text-xs text-gray-600 mt-1">
        Điểm được tính từ commit + mức “chạm” file theo nhóm
        {" "}
        (core, test, doc, other, noise).
        Lưu ý: <b>Focus</b> = mức tập trung vào <b>core</b>.
      </div>

      <div className="mt-3 space-y-3">
        <ExplainRow
          title={`Consistency: ${selected.scoreConsistency}/30`}
          percent={cPct}
          desc={consistencyText}
          meta={`commits: ${selected.commitCount}`}
        />

        <ExplainRow
          title={`Impact: ${selected.scoreImpact}/50`}
          percent={iPct}
          desc={impactText}
          meta={`coreTouches: ${selected.coreTouches}`}
        />

        <ExplainRow
          title={`Focus (core ratio): ${selected.scoreClean}/20`}
          percent={fPct}
          desc={focusText}
          meta={`coreTouches: ${selected.coreTouches} • totalTouches: ${totalTouches} • coreRatio: ${corePct}%`}
        />

        <ExplainRow
          title="Touches breakdown"
          percent={corePct}
          desc="Phân bố số lần chạm file theo từng nhóm để bạn đối chiếu với điểm Focus."
          meta={`core: ${selected.coreTouches} • test: ${testTouches} • doc: ${docTouches} • other: ${otherTouches} • noise: ${selected.noiseTouches}`}
        />
      </div>
    </div>
  );
}

function ExplainRow({
  title,
  percent,
  desc,
  meta,
}: {
  title: string;
  percent: number;
  desc: string;
  meta: string;
}) {
  return (
    <div className="bg-white border rounded-xl p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{title}</div>
          <div className="text-xs text-gray-600 mt-1">{desc}</div>
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

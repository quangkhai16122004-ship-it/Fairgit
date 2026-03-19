import { CommitItem } from "./commitExtract";
import { getTouchedFiles } from "./fileTouch";
import { tagFile } from "./fileRules";
import { buildEvidenceForAuthor } from "./evidence";
import type { EvidenceCommit, TopFile } from "./evidence";

export type ScoreRow = {
  authorEmail: string;
  authorName: string;
  commitCount: number;

  // touches breakdown
  coreTouches: number;
  testTouches: number;
  docTouches: number;
  otherTouches: number;
  noiseTouches: number;
  totalTouches: number;

  // scores
  scoreConsistency: number; // 0..30
  scoreImpact: number; // 0..50
  scoreClean: number; // 0..20
  scoreTotal: number; // 0..100

  evidenceCommits: EvidenceCommit[];
  topFiles: TopFile[];
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function weekKey(iso: string) {
  const d = new Date(iso);
  const firstJan = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d.getTime() - firstJan.getTime()) / 86400000);
  const week = Math.floor((days + firstJan.getDay()) / 7) + 1;
  return `${d.getFullYear()}-${week}`;
}

function computeImpactRaw(t: {
  coreTouches: number;
  testTouches: number;
  docTouches: number;
  otherTouches: number;
  noiseTouches: number;
}) {
  // Core là chính.
  // Test có giá trị phụ.
  // Doc/other có giá trị rất nhỏ.
  // Noise bị trừ nhẹ.
  return (
    1.0 * t.coreTouches +
    0.35 * t.testTouches +
    0.08 * t.docTouches +
    0.03 * t.otherTouches -
    0.1 * t.noiseTouches
  );
}

/**
 * Chấm điểm:
 * - Consistency (0..30): số tuần có hoạt động trong 90 ngày (chuẩn hoá theo 13 tuần)
 * - Impact (0..50): trọng số theo loại file chạm (core là chính, test/doc/other chỉ phụ)
 * - Clean (0..20): tỷ lệ core trong tổng touches + phạt theo bậc nếu có noise
 */
export async function scoreFromCommitsWithFiles(repoDir: string, commits: CommitItem[]): Promise<ScoreRow[]> {
  // gom theo email
  const byEmail = new Map<string, { name: string; commits: CommitItem[] }>();
  for (const c of commits) {
    const cur = byEmail.get(c.authorEmail) ?? { name: c.authorName, commits: [] };
    if (cur.name === "unknown" && c.authorName !== "unknown") cur.name = c.authorName;
    cur.commits.push(c);
    byEmail.set(c.authorEmail, cur);
  }

  const temp: Array<{
    email: string;
    name: string;
    commitCount: number;
    weeksActive: number;

    coreTouches: number;
    testTouches: number;
    docTouches: number;
    otherTouches: number;
    noiseTouches: number;
    totalTouches: number;

    evidenceCommits: EvidenceCommit[];
    topFiles: TopFile[];
  }> = [];

  for (const [email, v] of byEmail.entries()) {
    const weeks = new Set(v.commits.map((c) => weekKey(c.date)));

    let coreTouches = 0;
    let testTouches = 0;
    let docTouches = 0;
    let otherTouches = 0;
    let noiseTouches = 0;
    let totalTouches = 0;

    for (const c of v.commits) {
      const files = await getTouchedFiles(repoDir, c.hash);

      for (const f of files) {
        totalTouches += 1;
        const tag = tagFile(f);

        if (tag === "core") coreTouches += 1;
        else if (tag === "test") testTouches += 1;
        else if (tag === "doc") docTouches += 1;
        else if (tag === "noise") noiseTouches += 1;
        else otherTouches += 1;
      }
    }

    const { evidenceCommits, topFiles } = await buildEvidenceForAuthor(repoDir, v.commits);

    temp.push({
      email,
      name: v.name,
      commitCount: v.commits.length,
      weeksActive: weeks.size,

      coreTouches,
      testTouches,
      docTouches,
      otherTouches,
      noiseTouches,
      totalTouches,

      evidenceCommits,
      topFiles,
    });
  }

  // chỉ dùng những người có core/test thật để làm mốc normalize
  const impactRawList = temp.map((t) => Math.max(0, computeImpactRaw(t)));
  const impactRawListForBaseline = temp
    .filter((t) => t.coreTouches > 0 || t.testTouches > 0)
    .map((t) => Math.max(0, computeImpactRaw(t)));

  const maxImpactRaw =
    impactRawListForBaseline.length > 0
      ? Math.max(1, ...impactRawListForBaseline)
      : Math.max(1, ...impactRawList);

  const rows: ScoreRow[] = temp.map((t) => {
    // -------- Consistency (0..30)
    const consistencyRatio = Math.min(1, t.weeksActive / 13);
    const scoreConsistency = Math.round(consistencyRatio * 30);

    // -------- Impact (0..50)
    const impactRaw = Math.max(0, computeImpactRaw(t));
    const impactRatio = impactRaw / maxImpactRaw;
    let scoreImpact = Math.round(clamp(impactRatio, 0, 1) * 50);

    // Không đụng core thì không được xem là impact kỹ thuật cao.
    // Vẫn cho một ít điểm nếu có test/doc/other, nhưng không thể max.
    if (t.coreTouches === 0) {
      scoreImpact = Math.min(scoreImpact, 10);
    }

    // Nếu không có cả core lẫn test, tức chủ yếu là doc/other,
    // ép thấp hơn nữa để tránh "đẹp giả".
    if (t.coreTouches === 0 && t.testTouches === 0) {
      scoreImpact = Math.min(scoreImpact, 6);
    }

    // -------- Clean / Focus (0..20)
    const total = t.totalTouches || 0;
    const coreRatio = total > 0 ? t.coreTouches / total : 0;

    let scoreClean = Math.round(clamp(coreRatio, 0, 1) * 20);

    if (t.noiseTouches >= 1) scoreClean -= 2;
    if (t.noiseTouches >= 5) scoreClean -= 3;
    if (t.noiseTouches >= 20) scoreClean -= 5;
    scoreClean = clamp(scoreClean, 0, 20);

    const scoreTotal = scoreConsistency + scoreImpact + scoreClean;

    return {
      authorEmail: t.email,
      authorName: t.name,
      commitCount: t.commitCount,

      coreTouches: t.coreTouches,
      testTouches: t.testTouches,
      docTouches: t.docTouches,
      otherTouches: t.otherTouches,
      noiseTouches: t.noiseTouches,
      totalTouches: t.totalTouches,

      scoreConsistency,
      scoreImpact,
      scoreClean,
      scoreTotal,

      evidenceCommits: t.evidenceCommits,
      topFiles: t.topFiles,
    };
  });

  return rows.sort((a, b) => b.scoreTotal - a.scoreTotal);
}
import { CommitItem } from "./commitExtract";
import { getCommitFileStats, type CommitFileStat } from "./fileTouch";
import { tagFile } from "./fileRules";

export type EvidenceCommit = {
  hash: string;
  coreFiles: number;
  noiseFiles: number;
  totalFiles: number;
  changedLines: number;
  subject?: string;
};

export type TopFile = {
  path: string;
  touches: number;
  tag: string;
  changedLines: number;
};

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

  // scoring metadata
  activeDays: number;
  activeWeeks: number;
  tinyCommitCount: number;
  impactRaw: number;
  spamPenalty: number;
  scoreConfidence: number; // 0..100

  // scores
  scoreConsistency: number; // 0..30
  scoreImpact: number; // 0..50
  scoreClean: number; // 0..20
  scoreTotal: number; // 0..100

  evidenceCommits: EvidenceCommit[];
  topFiles: TopFile[];
};

type CommitSnapshot = {
  commit: CommitItem;
  files: CommitFileStat[];
  coreFiles: number;
  testFiles: number;
  docFiles: number;
  otherFiles: number;
  noiseFiles: number;
  changedLines: number;
  coreLines: number;
  testLines: number;
  docLines: number;
  otherLines: number;
  noiseLines: number;
  tinyCommit: boolean;
  tinyNonCoreCommit: boolean;
};

type AuthorAgg = {
  email: string;
  name: string;
  commitCount: number;
  days: Set<string>;
  weeks: Set<string>;

  coreTouches: number;
  testTouches: number;
  docTouches: number;
  otherTouches: number;
  noiseTouches: number;
  totalTouches: number;

  coreLines: number;
  testLines: number;
  docLines: number;
  otherLines: number;
  noiseLines: number;
  totalLines: number;

  tinyCommitCount: number;
  tinyCommitByDay: Map<string, number>;
  evidenceCommits: EvidenceCommit[];
  topFilesMap: Map<string, TopFile>;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function dayKey(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

function weekKey(iso: string) {
  const d = new Date(iso);
  const firstJan = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d.getTime() - firstJan.getTime()) / 86400000);
  const week = Math.floor((days + firstJan.getDay()) / 7) + 1;
  return `${d.getFullYear()}-${week}`;
}

function percentile(nums: number[], p: number) {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * p)));
  return sorted[idx];
}

function tagPriority(tag: string) {
  if (tag === "core") return 5;
  if (tag === "test") return 4;
  if (tag === "doc") return 3;
  if (tag === "other") return 2;
  if (tag === "noise") return 1;
  return 0;
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];
  const out = new Array<R>(items.length);
  let cursor = 0;

  const runWorker = async () => {
    while (true) {
      const i = cursor;
      cursor += 1;
      if (i >= items.length) break;
      out[i] = await worker(items[i], i);
    }
  };

  const jobs = Array.from({ length: Math.min(limit, items.length) }, () => runWorker());
  await Promise.all(jobs);
  return out;
}

function toCommitSnapshot(commit: CommitItem, files: CommitFileStat[]): CommitSnapshot {
  let coreFiles = 0;
  let testFiles = 0;
  let docFiles = 0;
  let otherFiles = 0;
  let noiseFiles = 0;

  let coreLines = 0;
  let testLines = 0;
  let docLines = 0;
  let otherLines = 0;
  let noiseLines = 0;
  let changedLines = 0;

  for (const f of files) {
    const tag = tagFile(f.path);
    const changes = Math.max(1, f.changes);
    changedLines += changes;

    if (tag === "core") {
      coreFiles += 1;
      coreLines += changes;
    } else if (tag === "test") {
      testFiles += 1;
      testLines += changes;
    } else if (tag === "doc") {
      docFiles += 1;
      docLines += changes;
    } else if (tag === "noise") {
      noiseFiles += 1;
      noiseLines += changes;
    } else {
      otherFiles += 1;
      otherLines += changes;
    }
  }

  const meaningfulLines = coreLines + testLines + docLines + otherLines;
  const tinyCommit = meaningfulLines <= 6 && files.length <= 2;
  const tinyNonCoreCommit = tinyCommit && coreFiles === 0 && testFiles === 0;

  // Tiny non-core commits (wording/format tweaks) are treated as mild noise signals.
  if (tinyNonCoreCommit && files.length > 0) {
    noiseFiles += 1;
    noiseLines += Math.max(1, Math.floor(meaningfulLines * 0.8));
  }

  return {
    commit,
    files,
    coreFiles,
    testFiles,
    docFiles,
    otherFiles,
    noiseFiles,
    changedLines,
    coreLines,
    testLines,
    docLines,
    otherLines,
    noiseLines,
    tinyCommit,
    tinyNonCoreCommit,
  };
}

function computeImpactRaw(a: AuthorAgg) {
  const corePart = 1.05 * Math.log1p(a.coreLines);
  const testPart = 0.45 * Math.log1p(a.testLines);
  const docPart = 0.08 * Math.log1p(a.docLines);
  const otherPart = 0.06 * Math.log1p(a.otherLines);
  const noisePenalty = 0.3 * Math.log1p(a.noiseLines);

  // breadth bonus: nhiều file core khác nhau tăng impact bền vững hơn "spam 1 file"
  const uniqueCoreFiles = [...a.topFilesMap.values()].filter((x) => x.tag === "core").length;
  const breadthBonus = 0.45 * Math.log1p(uniqueCoreFiles);

  return Math.max(0, corePart + testPart + docPart + otherPart + breadthBonus - noisePenalty);
}

function computeImpactScore(impactRaw: number, impactRef: number, impactMax: number) {
  const safeMax = Math.max(1, impactMax);
  const safeRef = Math.max(1, Math.min(impactRef, safeMax));

  if (safeMax - safeRef < 0.001) {
    return clamp(Math.round((impactRaw / safeMax) * 50), 0, 50);
  }

  if (impactRaw <= safeRef) {
    const base = impactRaw / safeRef;
    return clamp(Math.round(base * 38), 0, 50);
  }

  const tailRatio = clamp((impactRaw - safeRef) / (safeMax - safeRef), 0, 1);
  const normalized = 0.76 + 0.24 * Math.pow(tailRatio, 0.85);
  return clamp(Math.round(normalized * 50), 0, 50);
}

function computeConfidence(a: AuthorAgg) {
  const signalFromLines = Math.min(1, Math.log1p(a.totalLines) / Math.log1p(3000));
  const signalFromDays = Math.min(1, a.days.size / 14);
  const signalFromCommits = Math.min(1, a.commitCount / 20);
  const confidence = (0.5 * signalFromLines + 0.3 * signalFromDays + 0.2 * signalFromCommits) * 100;
  return clamp(Math.round(confidence), 0, 100);
}

function pushFileContribution(map: Map<string, TopFile>, f: CommitFileStat) {
  const tag = tagFile(f.path);
  const cur = map.get(f.path) ?? { path: f.path, touches: 0, tag, changedLines: 0 };
  cur.touches += 1;
  cur.changedLines += Math.max(1, f.changes);
  if (tagPriority(tag) > tagPriority(cur.tag)) cur.tag = tag;
  map.set(f.path, cur);
}

/**
 * Scoring v2:
 * - Chống spam commit nhỏ bằng tinyCommitCount + penalty theo noise ratio.
 * - Impact dựa trên thay đổi có trọng số theo nhóm file + log scale để giảm outlier.
 * - Consistency dựa trên số ngày/tuần hoạt động + phạt burst (dồn commit trong ít ngày).
 * - Clean phản ánh mức tập trung vào core và mức nhiễu.
 */
export async function scoreFromCommitsWithFiles(repoDir: string, commits: CommitItem[]): Promise<ScoreRow[]> {
  const snapshots = await mapLimit(commits, 8, async (c) => {
    try {
      const files = await getCommitFileStats(repoDir, c.hash);
      return toCommitSnapshot(c, files);
    } catch (err) {
      console.error(`[analyzer] failed to read commit ${c.hash}:`, err);
      return toCommitSnapshot(c, []);
    }
  });

  const byAuthor = new Map<string, AuthorAgg>();

  for (const s of snapshots) {
    const email = s.commit.authorEmail;
    const author = byAuthor.get(email) ?? {
      email,
      name: s.commit.authorName || "unknown",
      commitCount: 0,
      days: new Set<string>(),
      weeks: new Set<string>(),

      coreTouches: 0,
      testTouches: 0,
      docTouches: 0,
      otherTouches: 0,
      noiseTouches: 0,
      totalTouches: 0,

      coreLines: 0,
      testLines: 0,
      docLines: 0,
      otherLines: 0,
      noiseLines: 0,
      totalLines: 0,

      tinyCommitCount: 0,
      tinyCommitByDay: new Map<string, number>(),
      evidenceCommits: [],
      topFilesMap: new Map<string, TopFile>(),
    };

    if (author.name === "unknown" && s.commit.authorName !== "unknown") {
      author.name = s.commit.authorName;
    }

    author.commitCount += 1;
    author.days.add(dayKey(s.commit.date));
    author.weeks.add(weekKey(s.commit.date));
    const commitDay = dayKey(s.commit.date);
    if (s.tinyCommit) {
      author.tinyCommitCount += 1;
      author.tinyCommitByDay.set(commitDay, (author.tinyCommitByDay.get(commitDay) ?? 0) + 1);
    }

    author.coreTouches += s.coreFiles;
    author.testTouches += s.testFiles;
    author.docTouches += s.docFiles;
    author.otherTouches += s.otherFiles;
    author.noiseTouches += s.noiseFiles;
    author.totalTouches += s.files.length;

    author.coreLines += s.coreLines;
    author.testLines += s.testLines;
    author.docLines += s.docLines;
    author.otherLines += s.otherLines;
    author.noiseLines += s.noiseLines;
    author.totalLines += s.changedLines;

    author.evidenceCommits.push({
      hash: s.commit.hash,
      coreFiles: s.coreFiles,
      noiseFiles: s.noiseFiles,
      totalFiles: s.files.length,
      changedLines: s.changedLines,
      subject: s.commit.subject || "",
    });

    for (const f of s.files) {
      pushFileContribution(author.topFilesMap, f);
    }

    byAuthor.set(email, author);
  }

  const authors = [...byAuthor.values()];
  const impactRawList = authors.map(computeImpactRaw);
  const impactRef = Math.max(1, percentile(impactRawList, 0.75));
  const impactMax = Math.max(1, ...impactRawList);

  const rows: ScoreRow[] = authors.map((a) => {
    const activeDays = a.days.size;
    const activeWeeks = a.weeks.size;

    const dayRatio = Math.min(1, activeDays / 30);
    const weekRatio = Math.min(1, activeWeeks / 13);
    const commitsPerActiveDay = a.commitCount / Math.max(1, activeDays);
    const burstPenalty = commitsPerActiveDay > 5 ? 6 : commitsPerActiveDay > 3 ? 3 : 0;
    const scoreConsistency = clamp(Math.round((0.65 * weekRatio + 0.35 * dayRatio) * 30) - burstPenalty, 0, 30);

    const impactRaw = computeImpactRaw(a);
    let scoreImpact = computeImpactScore(impactRaw, impactRef, impactMax);
    if (a.coreTouches === 0) scoreImpact = Math.min(scoreImpact, 12);
    if (a.coreTouches === 0 && a.testTouches === 0) scoreImpact = Math.min(scoreImpact, 6);

    const meaningfulLines = a.coreLines + a.testLines + a.docLines + a.otherLines;
    const totalLines = a.totalLines || 0;
    const meaningfulRatio = totalLines > 0 ? meaningfulLines / totalLines : 0;
    const noiseRatio = totalLines > 0 ? a.noiseLines / totalLines : 0;
    const tinyRatio = a.commitCount > 0 ? a.tinyCommitCount / a.commitCount : 0;
    const tinyBurstDays = [...a.tinyCommitByDay.values()].filter((n) => n >= 3).length;

    const spamPenalty = clamp(
      Math.round(noiseRatio * 7 + tinyRatio * 9 + tinyBurstDays * 2 + (a.tinyCommitCount >= 8 ? 2 : 0)),
      0,
      16
    );
    const baseClean = Math.round((0.75 * meaningfulRatio + 0.25 * (1 - tinyRatio)) * 20);
    const scoreClean = clamp(baseClean - spamPenalty, 0, 20);

    const scoreConfidence = computeConfidence(a);
    const scoreTotal = clamp(scoreConsistency + scoreImpact + scoreClean, 0, 100);

    const evidenceCommits = [...a.evidenceCommits]
      .sort((x, y) => {
        if (y.coreFiles !== x.coreFiles) return y.coreFiles - x.coreFiles;
        if ((y.changedLines ?? 0) !== (x.changedLines ?? 0)) return (y.changedLines ?? 0) - (x.changedLines ?? 0);
        if (x.noiseFiles !== y.noiseFiles) return x.noiseFiles - y.noiseFiles;
        return y.totalFiles - x.totalFiles;
      })
      .slice(0, 5);

    const topFiles = [...a.topFilesMap.values()]
      .sort((x, y) => {
        if (y.changedLines !== x.changedLines) return y.changedLines - x.changedLines;
        if (y.touches !== x.touches) return y.touches - x.touches;
        return tagPriority(y.tag) - tagPriority(x.tag);
      })
      .slice(0, 10);

    return {
      authorEmail: a.email,
      authorName: a.name,
      commitCount: a.commitCount,

      coreTouches: a.coreTouches,
      testTouches: a.testTouches,
      docTouches: a.docTouches,
      otherTouches: a.otherTouches,
      noiseTouches: a.noiseTouches,
      totalTouches: a.totalTouches,

      activeDays,
      activeWeeks,
      tinyCommitCount: a.tinyCommitCount,
      impactRaw,
      spamPenalty,
      scoreConfidence,

      scoreConsistency,
      scoreImpact,
      scoreClean,
      scoreTotal,

      evidenceCommits,
      topFiles,
    };
  });

  return rows.sort((a, b) => {
    if (b.scoreTotal !== a.scoreTotal) return b.scoreTotal - a.scoreTotal;
    if (b.scoreImpact !== a.scoreImpact) return b.scoreImpact - a.scoreImpact;
    return b.scoreConsistency - a.scoreConsistency;
  });
}

import { CommitItem } from "./commitExtract";
import { getTouchedFiles } from "./fileTouch";
import { tagFile } from "./fileRules";

export type ScoreRow = {
  authorEmail: string;
  authorName: string;
  commitCount: number;

  coreTouches: number;
  noiseTouches: number;

  scoreConsistency: number; // 0..30
  scoreImpact: number;      // 0..50
  scoreClean: number;       // 0..20
  scoreTotal: number;       // 0..100

  totalTouches: number;
};

function weekKey(iso: string) {
  const d = new Date(iso);
  const firstJan = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d.getTime() - firstJan.getTime()) / 86400000);
  const week = Math.floor((days + firstJan.getDay()) / 7) + 1;
  return `${d.getFullYear()}-${week}`;
}

/**
 * Chấm điểm dựa trên:
 * - Consistency: số tuần hoạt động (0..30)
 * - Impact: số lần chạm file core (0..50)
 * - Clean: tỷ lệ "không noise" (0..20)
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

  // bước 1: tính touches core/noise cho từng người
  const temp: Array<{
    email: string;
    name: string;
    commitCount: number;
    weeksActive: number;
    coreTouches: number;
    noiseTouches: number;
    totalTouches: number;
  }> = [];

  for (const [email, v] of byEmail.entries()) {
    const weeks = new Set(v.commits.map((c) => weekKey(c.date)));

    let coreTouches = 0;
    let noiseTouches = 0;
    let totalTouches = 0;

    // Lấy file touched cho từng commit (chạy lần lượt để đơn giản)
    for (const c of v.commits) {
      const files = await getTouchedFiles(repoDir, c.hash);
      for (const f of files) {
        totalTouches += 1;
        const tag = tagFile(f);
        if (tag === "core") coreTouches += 1;
        else if (tag === "noise") noiseTouches += 1;
      }
    }

    temp.push({
        email,
        name: v.name,
        commitCount: v.commits.length,
        weeksActive: weeks.size,
        coreTouches,
        noiseTouches,
        totalTouches,
    });
  }

  // chuẩn hoá để ra điểm 0..50
  const maxCoreTouches = Math.max(1, ...temp.map((t) => t.coreTouches));

  const rows: ScoreRow[] = temp.map((t) => {
    // Consistency: 90 ngày ~ 13 tuần
    const consistencyRatio = Math.min(1, t.weeksActive / 13);
    const scoreConsistency = Math.round(consistencyRatio * 30);

    // Impact: dựa trên coreTouches (chuẩn hoá theo người cao nhất)
    // Impact: core được tính mạnh, other (không noise) vẫn có giá trị nhưng thấp hơn.
    // nonNoiseTouches = total - noise
    const nonNoiseTouches = Math.max(0, t.totalTouches - t.noiseTouches);

    // chuẩn hoá impact theo "coreTouches" là chính (và có thêm nonNoise nhỏ)
    const impactRaw = t.coreTouches + 0.25 * nonNoiseTouches;
    const maxImpactRaw = Math.max(1, ...temp.map(x => (x.coreTouches + 0.25 * Math.max(0, x.totalTouches - x.noiseTouches))));

    const impactRatio = impactRaw / maxImpactRaw;
    const scoreImpact = Math.round(impactRatio * 50);

    // Clean: tỷ lệ không-noise trên tổng
    const cleanRatio = nonNoiseTouches / (t.totalTouches + 1);
    const scoreClean = Math.round(cleanRatio * 20);

    const scoreTotal = scoreConsistency + scoreImpact + scoreClean;

    return {
      authorEmail: t.email,
      authorName: t.name,
      commitCount: t.commitCount,
      coreTouches: t.coreTouches,
      noiseTouches: t.noiseTouches,
      scoreConsistency,
      scoreImpact,
      scoreClean,
      scoreTotal,
      totalTouches: t.totalTouches,
    };
  });

  return rows.sort((a, b) => b.scoreTotal - a.scoreTotal);
}
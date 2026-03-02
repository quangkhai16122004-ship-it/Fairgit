import { CommitItem } from "./commitExtract";

export type ScoreRow = {
  authorEmail: string;
  authorName: string;
  commitCount: number;

  scoreConsistency: number; // 0..30
  scoreImpact: number;      // 0..50
  scoreClean: number;       // 0..20
  scoreTotal: number;       // 0..100
};

function weekKey(iso: string) {
  const d = new Date(iso);
  // key dạng YYYY-WW (đơn giản, đủ dùng)
  const firstJan = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d.getTime() - firstJan.getTime()) / 86400000);
  const week = Math.floor((days + firstJan.getDay()) / 7) + 1;
  return `${d.getFullYear()}-${week}`;
}

export function scoreFromCommits(commits: CommitItem[]): ScoreRow[] {
  // nhóm theo email
  const byEmail = new Map<string, { name: string; commits: CommitItem[] }>();
  for (const c of commits) {
    const email = c.authorEmail;
    const cur = byEmail.get(email) ?? { name: c.authorName, commits: [] };
    if (cur.name === "unknown" && c.authorName !== "unknown") cur.name = c.authorName;
    cur.commits.push(c);
    byEmail.set(email, cur);
  }

  const rows: ScoreRow[] = [];

  // commitCount max để chuẩn hoá
  const maxCommits = Math.max(1, ...[...byEmail.values()].map((v) => v.commits.length));

  for (const [email, v] of byEmail.entries()) {
    const commitCount = v.commits.length;

    // (1) Consistency: số tuần có hoạt động / max tuần
    const weeks = new Set(v.commits.map((c) => weekKey(c.date)));
    const weeksActive = weeks.size;
    // giả sử 90 ngày ~ 13 tuần, clamp
    const consistency = Math.min(1, weeksActive / 13);

    // (2) Impact: tạm thời dùng commitCount làm proxy (bước 9 sẽ thay bằng “core files”)
    // chuẩn hoá theo maxCommits
    const impact = commitCount / maxCommits;

    // (3) Clean: tạm cho full điểm (bước 9 mới trừ lock/build/dist)
    const clean = 1;

    const scoreConsistency = Math.round(consistency * 30);
    const scoreImpact = Math.round(impact * 50);
    const scoreClean = Math.round(clean * 20);
    const scoreTotal = scoreConsistency + scoreImpact + scoreClean;

    rows.push({
      authorEmail: email,
      authorName: v.name,
      commitCount,
      scoreConsistency,
      scoreImpact,
      scoreClean,
      scoreTotal,
    });
  }

  return rows.sort((a, b) => b.scoreTotal - a.scoreTotal);
}
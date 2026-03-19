import { CommitItem } from "./commitExtract";
import { getTouchedFiles } from "./fileTouch";
import { tagFile } from "./fileRules";

export type EvidenceCommit = { hash: string; coreFiles: number; noiseFiles: number; totalFiles: number };
export type TopFile = { path: string; touches: number; tag: string };

function tagPriority(tag: string) {
  if (tag === "core") return 5;
  if (tag === "test") return 4;
  if (tag === "doc") return 3;
  if (tag === "other") return 2;
  if (tag === "noise") return 1;
  return 0;
}

export async function buildEvidenceForAuthor(repoDir: string, commits: CommitItem[]) {
  const commitEvidence: EvidenceCommit[] = [];
  const fileCount = new Map<string, { touches: number; tag: string }>();

  for (const c of commits) {
    const files = await getTouchedFiles(repoDir, c.hash);

    let coreFiles = 0;
    let noiseFiles = 0;

    for (const f of files) {
      const t = tagFile(f);
      if (t === "core") coreFiles += 1;
      if (t === "noise") noiseFiles += 1;

      const cur = fileCount.get(f) ?? { touches: 0, tag: t };
      cur.touches += 1;

      // giữ tag "mạnh" hơn
      if (tagPriority(t) > tagPriority(cur.tag)) {
        cur.tag = t;
      }

      fileCount.set(f, cur);
    }

    commitEvidence.push({ hash: c.hash, coreFiles, noiseFiles, totalFiles: files.length });
  }

  // Ưu tiên commit có core thật.
  // Nếu bằng nhau mới xét totalFiles.
  const commitsWithCore = commitEvidence
    .filter((c) => c.coreFiles > 0)
    .sort((a, b) => {
      if (b.coreFiles !== a.coreFiles) return b.coreFiles - a.coreFiles;
      if (a.noiseFiles !== b.noiseFiles) return a.noiseFiles - b.noiseFiles;
      return b.totalFiles - a.totalFiles;
    });

  const commitsWithoutCore = commitEvidence
    .filter((c) => c.coreFiles === 0)
    .sort((a, b) => {
      if (a.noiseFiles !== b.noiseFiles) return a.noiseFiles - b.noiseFiles;
      return b.totalFiles - a.totalFiles;
    });

  // Nếu có commit core thì ưu tiên lấy chúng trước.
  // Chỉ fallback sang commit không-core khi chưa đủ 5.
  const evidenceCommits = [...commitsWithCore, ...commitsWithoutCore].slice(0, 5);

  // top files theo touches, ưu tiên tag mạnh hơn khi bằng touches
  const topFiles: TopFile[] = [...fileCount.entries()]
    .map(([path, v]) => ({ path, touches: v.touches, tag: v.tag }))
    .sort((a, b) => {
      if (b.touches !== a.touches) return b.touches - a.touches;
      return tagPriority(b.tag) - tagPriority(a.tag);
    })
    .slice(0, 10);

  return { evidenceCommits, topFiles };
}
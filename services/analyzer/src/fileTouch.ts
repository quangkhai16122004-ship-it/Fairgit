import { simpleGit, SimpleGit } from "simple-git";

export type CommitFileStat = {
  path: string;
  additions: number;
  deletions: number;
  changes: number;
  isBinary: boolean;
};

function parseNum(n: string) {
  const parsed = Number.parseInt(n, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

/**
 * Lấy thống kê file thay đổi (numstat) trong một commit.
 * `changes` = additions + deletions; với file nhị phân thì gán tối thiểu 1.
 */
export async function getCommitFileStats(repoDir: string, commitHash: string): Promise<CommitFileStat[]> {
  const git: SimpleGit = simpleGit(repoDir);
  const out = await git.show(["--numstat", "--format=", commitHash]);

  return out
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const parts = line.split("\t");
      const addRaw = parts[0] ?? "0";
      const delRaw = parts[1] ?? "0";
      const path = parts.slice(2).join("\t").trim();

      const isBinary = addRaw === "-" || delRaw === "-";
      const additions = isBinary ? 0 : parseNum(addRaw);
      const deletions = isBinary ? 0 : parseNum(delRaw);
      const changes = isBinary ? 1 : Math.max(0, additions + deletions);

      return { path, additions, deletions, changes, isBinary };
    })
    .filter((x) => x.path.length > 0);
}

/**
 * Lấy danh sách file bị thay đổi trong 1 commit.
 * Trả về mảng đường dẫn file (string).
 */
export async function getTouchedFiles(repoDir: string, commitHash: string): Promise<string[]> {
  const rows = await getCommitFileStats(repoDir, commitHash);
  return rows.map((r) => r.path);
}

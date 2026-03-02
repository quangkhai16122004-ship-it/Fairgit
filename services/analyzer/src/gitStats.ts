import path from "path";
import fs from "fs";
import os from "os";
import { simpleGit } from "simple-git";

export type AuthorStat = {
  authorName: string;
  authorEmail: string;
  commitCount: number;
};

function safeFolderName(repoUrl: string) {
  return repoUrl.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 80);
}

export async function getCommitStatsByAuthor(repoUrl: string): Promise<AuthorStat[]> {
  const baseDir = path.join(os.tmpdir(), "fairgit_repos");
  if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

  const repoDir = path.join(baseDir, safeFolderName(repoUrl));

  // clone nếu chưa có, còn có rồi thì fetch update
  const git = simpleGit();
  if (!fs.existsSync(path.join(repoDir, ".git"))) {
    await git.clone(repoUrl, repoDir, ["--no-checkout", "--depth", "200"]);
  } else {
    await simpleGit(repoDir).fetch();
  }

  const repoGit = simpleGit(repoDir);

  // lấy log (toàn bộ) — sau này sẽ giới hạn theo thời gian/sprint
  const log = await repoGit.log();

  // thống kê theo email (ổn hơn theo name)
  const map = new Map<string, AuthorStat>();

  for (const c of log.all) {
    const email = (c.author_email || "unknown").toLowerCase();
    const name = c.author_name || "unknown";

    const cur = map.get(email) ?? { authorEmail: email, authorName: name, commitCount: 0 };
    cur.commitCount += 1;

    // nếu name trước đó unknown mà giờ có name thì cập nhật
    if (cur.authorName === "unknown" && name !== "unknown") cur.authorName = name;

    map.set(email, cur);
  }

  return [...map.values()].sort((a, b) => b.commitCount - a.commitCount);
}
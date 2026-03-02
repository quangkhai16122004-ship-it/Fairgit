import path from "path";
import fs from "fs";
import os from "os";
import { simpleGit } from "simple-git";

export type CommitItem = {
  hash: string;
  authorName: string;
  authorEmail: string;
  date: string; // ISO string
};

function safeFolderName(repoUrl: string) {
  return repoUrl.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 80);
}

export async function ensureRepo(repoUrl: string) {
  const baseDir = path.join(os.tmpdir(), "fairgit_repos");
  if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

  const repoDir = path.join(baseDir, safeFolderName(repoUrl));
  const git = simpleGit();

  // clone nhanh + tránh lỗi path dài (Windows)
  if (!fs.existsSync(path.join(repoDir, ".git"))) {
    await git.clone(repoUrl, repoDir, ["--no-checkout", "--depth", "200"]);
  } else {
    await simpleGit(repoDir).fetch(["--depth", "200"]);
  }

  return repoDir;
}

export async function getRecentCommits(repoDir: string, days = 90): Promise<CommitItem[]> {
  const repoGit = simpleGit(repoDir);
  const log = await repoGit.log([`--since=${days}.days.ago`]);

  return log.all.map((c) => ({
    hash: c.hash,
    authorName: c.author_name || "unknown",
    authorEmail: (c.author_email || "unknown").toLowerCase(),
    date: c.date,
  }));
}
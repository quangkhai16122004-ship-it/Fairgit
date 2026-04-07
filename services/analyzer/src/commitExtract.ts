import path from "path";
import fs from "fs";
import os from "os";
import crypto from "crypto";
import { simpleGit } from "simple-git";

export type CommitItem = {
  hash: string;
  authorName: string;
  authorEmail: string;
  date: string; // ISO string
  subject?: string;
};

function safeFolderName(repoUrl: string) {
  const short = repoUrl.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
  const hash = crypto.createHash("sha1").update(repoUrl).digest("hex").slice(0, 12);
  return `${short}_${hash}`;
}

async function resolveRemoteDefaultBranch(repoDir: string): Promise<string> {
  const git = simpleGit(repoDir);

  try {
    const headRef = (await git.raw(["symbolic-ref", "refs/remotes/origin/HEAD"])).trim();
    if (headRef.startsWith("refs/remotes/")) {
      return headRef.replace("refs/remotes/", "");
    }
  } catch {
    // fallback bên dưới
  }

  const remoteBranches = await git.branch(["-r"]);
  const all = remoteBranches.all || [];

  if (all.includes("origin/main")) return "origin/main";
  if (all.includes("origin/master")) return "origin/master";

  const firstRealRemote = all.find(
    (b) => b !== "origin/HEAD" && b.startsWith("origin/")
  );
  if (firstRealRemote) return firstRealRemote;

  throw new Error("Cannot resolve remote default branch");
}

export async function ensureRepo(repoUrl: string) {
  const baseDir = path.join(os.tmpdir(), "fairgit_repos");
  if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

  const repoDir = path.join(baseDir, safeFolderName(repoUrl));
  const git = simpleGit();

  const gitDir = path.join(repoDir, ".git");

  if (!fs.existsSync(gitDir)) {
    await git.clone(repoUrl, repoDir, ["--no-checkout", "--depth", "200"]);
  }

  const repoGit = simpleGit(repoDir);

  // kiểm tra remote origin có đúng repoUrl không
  try {
    const currentOrigin = (await repoGit.raw(["remote", "get-url", "origin"])).trim();
    if (currentOrigin !== repoUrl) {
      fs.rmSync(repoDir, { recursive: true, force: true });
      await git.clone(repoUrl, repoDir, ["--no-checkout", "--depth", "200"]);
    }
  } catch {
    fs.rmSync(repoDir, { recursive: true, force: true });
    await git.clone(repoUrl, repoDir, ["--no-checkout", "--depth", "200"]);
  }

  const freshGit = simpleGit(repoDir);
  await freshGit.fetch(["origin", "--prune", "--depth", "200"]);

  return repoDir;
}

export async function getRecentCommits(repoDir: string, days = 90, maxCount = 5000): Promise<CommitItem[]> {
  const repoGit = simpleGit(repoDir);
  const targetRef = await resolveRemoteDefaultBranch(repoDir);

  const log = await repoGit.log([
    targetRef,
    `--since=${days}.days.ago`,
    `--max-count=${maxCount}`,
  ]);

  return log.all.map((c) => ({
    hash: c.hash,
    authorName: c.author_name || "unknown",
    authorEmail: (c.author_email || "unknown").toLowerCase(),
    date: c.date,
    subject: (c.message || "").trim(),
  }));
}


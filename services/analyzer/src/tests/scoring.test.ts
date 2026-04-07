import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { simpleGit } from "simple-git";
import { getRecentCommits } from "../commitExtract";
import { scoreFromCommitsWithFiles } from "../scoreByFiles";

async function commitAs(input: {
  repoDir: string;
  filePath: string;
  content: string;
  message: string;
  author: string;
  isoDate: string;
}) {
  const fullPath = path.join(input.repoDir, input.filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, input.content, "utf8");

  const git = simpleGit(input.repoDir);
  await git.add([input.filePath]);
  await git.raw([
    "commit",
    "-m",
    input.message,
    `--author=${input.author}`,
    `--date=${input.isoDate}`,
    "--no-gpg-sign",
  ]);
}

async function createFixtureRepo() {
  const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), "fairgit-test-"));
  const git = simpleGit(repoDir);
  await git.init();
  await git.addConfig("user.name", "FairGit Test Runner");
  await git.addConfig("user.email", "test-runner@fairgit.local");

  // Contributor A: thay đổi đều và chạm core.
  await commitAs({
    repoDir,
    filePath: "src/service.ts",
    content: "export const v = 1;\n",
    message: "feat: init service",
    author: "Alice <alice@example.com>",
    isoDate: "2026-02-01T10:00:00.000Z",
  });
  await commitAs({
    repoDir,
    filePath: "src/service.ts",
    content: "export const v = 2;\nexport const n = 1;\n",
    message: "feat: extend service",
    author: "Alice <alice@example.com>",
    isoDate: "2026-02-10T10:00:00.000Z",
  });
  await commitAs({
    repoDir,
    filePath: "src/service.ts",
    content: "export const v = 3;\nexport const n = 2;\n",
    message: "feat: improve service",
    author: "Alice <alice@example.com>",
    isoDate: "2026-02-18T10:00:00.000Z",
  });

  // Contributor B: nhiều commit nhỏ, chủ yếu docs/noise.
  await commitAs({
    repoDir,
    filePath: "README.md",
    content: "tiny-1\n",
    message: "docs: tiny 1",
    author: "Bob <bob@example.com>",
    isoDate: "2026-02-19T11:00:00.000Z",
  });
  await commitAs({
    repoDir,
    filePath: "README.md",
    content: "tiny-2\n",
    message: "docs: tiny 2",
    author: "Bob <bob@example.com>",
    isoDate: "2026-02-19T11:05:00.000Z",
  });
  await commitAs({
    repoDir,
    filePath: "dist/bundle.js",
    content: "console.log('noise');\n",
    message: "chore: update bundle",
    author: "Bob <bob@example.com>",
    isoDate: "2026-02-19T11:10:00.000Z",
  });

  return repoDir;
}

async function main() {
  const repoDir = await createFixtureRepo();
  const commits = await getRecentCommits(repoDir, 365, 500);
  const rows = await scoreFromCommitsWithFiles(repoDir, commits);

  const alice = rows.find((r) => r.authorEmail === "alice@example.com");
  const bob = rows.find((r) => r.authorEmail === "bob@example.com");

  assert.ok(alice, "missing alice");
  assert.ok(bob, "missing bob");

  assert.ok(alice.scoreTotal > bob.scoreTotal, "meaningful contributor should rank higher");
  assert.ok(alice.scoreImpact > bob.scoreImpact, "core-heavy contributor should have higher impact");
  assert.ok(alice.scoreClean > bob.scoreClean, "tiny/noisy contributor should have lower clean score");
  assert.ok(bob.spamPenalty >= alice.spamPenalty, "spam/noise contributor should get higher spam penalty");
  assert.ok(alice.scoreConfidence >= bob.scoreConfidence, "stable contributor should not have lower confidence");

  console.log("✅ scoring test passed");
}

main().catch((err) => {
  const msg = String((err as any)?.message ?? err);
  if (msg.includes("spawn EPERM")) {
    console.warn("⚠️ scoring test skipped: sandbox does not allow spawning git process");
    process.exit(0);
  }
  console.error("❌ scoring test failed", err);
  process.exit(1);
});

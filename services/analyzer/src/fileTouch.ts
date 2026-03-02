import { simpleGit, SimpleGit } from "simple-git";

/**
 * Lấy danh sách file bị thay đổi trong 1 commit.
 * Trả về mảng đường dẫn file (string).
 */
export async function getTouchedFiles(repoDir: string, commitHash: string): Promise<string[]> {
  const git: SimpleGit = simpleGit(repoDir);

  // --name-only: chỉ lấy tên file
  // --pretty="" : bỏ phần message/author, chỉ còn file list
  const out = await git.show(["--name-only", "--pretty=", commitHash]);

  return out
    .split(/\r?\n/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
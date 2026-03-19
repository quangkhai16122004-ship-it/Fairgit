export type FileTag = "core" | "noise" | "test" | "doc" | "other";

export function tagFile(pathRaw: string): FileTag {
  const p = String(pathRaw || "").replace(/\\/g, "/").toLowerCase().trim();

  // 1) Noise: file sinh ra tự động / không phản ánh đóng góp thật
  // - thư mục build/dist/out/coverage
  // - lockfile
  // - file minified
  // - node_modules
  // - cache
  if (
    p.includes("node_modules/") ||
    p.startsWith("dist/") ||
    p.includes("/dist/") ||
    p.startsWith("build/") ||
    p.includes("/build/") ||
    p.startsWith("out/") ||
    p.includes("/out/") ||
    p.startsWith("coverage/") ||
    p.includes("/coverage/") ||
    p.includes(".min.") ||
    p.endsWith(".map") ||
    p.endsWith("package-lock.json") ||
    p.endsWith("pnpm-lock.yaml") ||
    p.endsWith("yarn.lock")
  ) {
    return "noise";
  }

  // 2) Test
  if (
    p.includes("__tests__/") ||
    p.includes("/test/") ||
    p.includes("/tests/") ||
    p.endsWith(".test.js") ||
    p.endsWith(".test.ts") ||
    p.endsWith(".test.tsx") ||
    p.endsWith(".spec.js") ||
    p.endsWith(".spec.ts") ||
    p.endsWith(".spec.tsx")
  ) {
    return "test";
  }

  // 3) Doc
  if (
    p.endsWith(".md") ||
    p.startsWith("docs/") ||
    p.includes("/docs/") ||
    p.endsWith(".txt")
  ) {
    return "doc";
  }

  // 4) Core (tuỳ dự án, rule đơn giản để demo)
  // Bạn có thể tuỳ biến theo repo của bạn (ví dụ src/, packages/, services/, apps/)
  if (
    p.startsWith("src/") ||
    p.includes("/src/") ||
    p.startsWith("packages/") ||
    p.includes("/packages/") ||
    p.startsWith("apps/") ||
    p.includes("/apps/") ||
    p.startsWith("services/") ||
    p.includes("/services/")
  ) {
    return "core";
  }

  return "other";
}
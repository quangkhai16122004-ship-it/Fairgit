import { CORE_PREFIXES, NOISE_EXACT, NOISE_PREFIXES, DOC_EXACT, DOC_PREFIXES, TEST_PREFIXES } from "./rules";

export type FileTag = "core" | "noise" | "doc" | "test" | "other";

function startsWithAny(s: string, prefixes: string[]) {
  return prefixes.some((p) => s.startsWith(p));
}

export function tagFile(filePath: string): FileTag {
  const p = filePath.replace(/\\/g, "/").trim(); // normalize

  if (NOISE_EXACT.includes(p) || startsWithAny(p, NOISE_PREFIXES)) return "noise";
  if (DOC_EXACT.includes(p) || startsWithAny(p, DOC_PREFIXES)) return "doc";
  if (startsWithAny(p, TEST_PREFIXES) || p.includes("/__tests__/")) return "test";
  if (startsWithAny(p, CORE_PREFIXES)) return "core";

  return "other";
}
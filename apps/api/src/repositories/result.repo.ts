import { Types } from "mongoose";
import { Result } from "../models/Result";

function toSafeInt(value: unknown, fallback: number, min: number, max: number) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

export async function listResultsByRun(
  runId: string,
  opts?: { limit?: number; offset?: number; q?: string; sortBy?: string; sortDir?: "asc" | "desc" }
) {
  if (!Types.ObjectId.isValid(runId)) {
    throw new Error("Invalid runId");
  }

  const limit = toSafeInt(opts?.limit, 200, 1, 200);
  const offset = toSafeInt(opts?.offset, 0, 0, 1_000_000);
  const q = (opts?.q ?? "").trim().toLowerCase();

  const filter: Record<string, unknown> = { runId: new Types.ObjectId(runId) };
  if (q) {
    filter.$or = [
      { authorEmail: { $regex: q, $options: "i" } },
      { authorName: { $regex: q, $options: "i" } },
    ];
  }

  const allowSort = new Set(["scoreTotal", "scoreImpact", "scoreConsistency", "scoreClean", "scoreConfidence", "commitCount"]);
  const sortBy = allowSort.has(String(opts?.sortBy)) ? String(opts?.sortBy) : "scoreTotal";
  const sortDir: 1 | -1 = opts?.sortDir === "asc" ? 1 : -1;

  const sort: Record<string, 1 | -1> = { [sortBy]: sortDir };
  if (sortBy !== "scoreTotal") sort.scoreTotal = -1;
  if (sortBy !== "scoreImpact") sort.scoreImpact = -1;

  const [items, total] = await Promise.all([
    Result.find(filter)
      .sort(sort)
      .skip(offset)
      .limit(limit)
      .lean(),
    Result.countDocuments(filter),
  ]);

  return { items, total, limit, offset };
}

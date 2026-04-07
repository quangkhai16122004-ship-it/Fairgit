import { Request, Response } from "express";
import * as repo from "../repositories/result.repo";

export async function listByRun(req: Request, res: Response) {
  try {
    const runId = String(req.params.runId);
    const limit = Number(req.query.limit ?? 200);
    const offset = Number(req.query.offset ?? 0);
    const q = String(req.query.q ?? "");
    const sortBy = String(req.query.sortBy ?? "scoreTotal");
    const sortDir = (String(req.query.sortDir ?? "desc").toLowerCase() === "asc" ? "asc" : "desc") as
      | "asc"
      | "desc";

    const results = await repo.listResultsByRun(runId, { limit, offset, q, sortBy, sortDir });
    res.json(results);
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? "Bad Request" });
  }
}

import { Request, Response } from "express";
import * as repo from "../repositories/result.repo";

export async function listByRun(req: Request, res: Response) {
  try {
    const runId = String(req.params.runId);
    const results = await repo.listResultsByRun(runId);
    res.json(results);
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? "Bad Request" });
  }
}
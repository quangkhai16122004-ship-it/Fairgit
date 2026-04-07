import { Request, Response } from "express";
import * as service from "../services/run.service";
import { analysisQueue } from "../configs/queue";

export async function createRun(req: Request, res: Response) {
  try {
    const projectId = String(req.params.projectId);
    const { run, reused } = await service.createRun(projectId);

    // Nếu đã có run pending/running thì trả lại run đó để tránh job trùng.
    if (reused) {
      res.status(200).json(run);
      return;
    }

    const runId = String((run as any)._id);
    await analysisQueue.add("analyze", { projectId, runId }, { jobId: runId });
    res.status(201).json(run);
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? "Bad Request" });
  }
}

export async function getRun(req: Request, res: Response) {
  try {
    const runId = String(req.params.runId);
    const run = await service.getRun(runId);
    res.json(run);
  } catch (err: any) {
    res.status(404).json({ error: err?.message ?? "Not Found" });
  }
}

export async function listRuns(req: Request, res: Response) {
  try {
    const runs = await service.listRuns(req.query);
    res.json(runs);
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? "Bad Request" });
  }
}

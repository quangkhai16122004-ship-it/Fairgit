import { Request, Response } from "express";
import * as service from "../services/run.service";
import { analysisQueue } from "../configs/queue";

export async function createRun(req: Request, res: Response) {
  try {
    const projectId = String(req.params.projectId);
    const run = await service.createRun(projectId);
    const runId = (run as any)._id.toString();
    await analysisQueue.add("analyze", { projectId, runId });
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
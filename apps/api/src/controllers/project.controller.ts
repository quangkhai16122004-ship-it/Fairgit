import { Request, Response } from "express";
import * as service from "../services/project.service";

export async function createProject(req: Request, res: Response) {
  try {
    const result = await service.createProject(req.body);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? "Bad Request" });
  }
}

export async function listProjects(_req: Request, res: Response) {
  const result = await service.listProjects();
  res.json(result);
}

export async function updateProject(req: Request, res: Response) {
  try {
    const result = await service.updateProject(String(req.params.id), req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? "Bad Request" });
  }
}

export async function deleteProject(req: Request, res: Response) {
  try {
    await service.deleteProject(String(req.params.id));
    res.json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? "Bad Request" });
  }
}
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
import { Request, Response } from "express";
import * as repo from "../repositories/dashboard.repo";

export async function summary(req: Request, res: Response) {
  try {
    const data = await repo.getDashboardSummary();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Internal Server Error" });
  }
}
import { Types } from "mongoose";
import { Run } from "../models/Run";

export async function createRun(projectId: string) {
  return Run.create({ projectId: new Types.ObjectId(projectId), status: "pending" });
}

export async function getRun(runId: string) {
  return Run.findById(runId).lean();
}
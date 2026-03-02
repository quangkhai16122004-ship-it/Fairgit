import { Types } from "mongoose";
import { Result } from "../models/Result";

export async function listResultsByRun(runId: string) {
  return Result.find({ runId: new Types.ObjectId(runId) })
    .sort({ commitCount: -1 })
    .lean();
}
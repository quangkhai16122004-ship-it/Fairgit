import { Types } from "mongoose";
import { Result } from "../models/Result";

export async function listResultsByRun(runId: string) {
  if (!Types.ObjectId.isValid(runId)) {
    throw new Error("Invalid runId");
  }

  return Result.find({ runId: new Types.ObjectId(runId) })
    .sort({ scoreTotal: -1 })
    .lean();
}

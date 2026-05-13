import { Types } from "mongoose";
import { Run } from "../models/Run";

export async function findActiveRunByProject(projectId: string) {
  return Run.findOne({
    projectId: new Types.ObjectId(projectId),
    status: { $in: ["pending", "running"] },
  })
    .sort({ createdAt: -1 })
    .lean();
}

export async function createRun(projectId: string) {
  return Run.create({
    projectId: new Types.ObjectId(projectId),
    status: "pending",
    progress: 0,
  });
}

export async function getRun(runId: string) {
  return Run.findById(runId).lean();
}

export async function deleteRun(runId: string) {
  return Run.findByIdAndDelete(runId);
}

export async function listRuns(input: {
  projectId?: string;
  status?: "pending" | "running" | "done" | "failed";
  limit: number;
  offset: number;
}) {
  const filter: Record<string, unknown> = {};
  if (input.projectId) filter.projectId = new Types.ObjectId(input.projectId);
  if (input.status) filter.status = input.status;

  const [items, total] = await Promise.all([
    Run.find(filter)
      .sort({ createdAt: -1 })
      .skip(input.offset)
      .limit(input.limit)
      .lean(),
    Run.countDocuments(filter),
  ]);

  return {
    items,
    total,
    limit: input.limit,
    offset: input.offset,
  };
}

import { z } from "zod";
import * as repo from "../repositories/run.repo";
import { Project } from "../models/Project";

const ObjectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "invalid id");
const ListRunsQuerySchema = z.object({
  projectId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  status: z.enum(["pending", "running", "done", "failed"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function createRun(projectId: string) {
  ObjectIdSchema.parse(projectId);

  const project = await Project.findById(projectId).lean();
  if (!project) {
    throw new Error("Project not found");
  }

  const active = await repo.findActiveRunByProject(projectId);
  if (active) {
    return { run: active, reused: true as const };
  }

  const run = await repo.createRun(projectId);
  return { run, reused: false as const };
}

export async function getRun(runId: string) {
  ObjectIdSchema.parse(runId);
  const run = await repo.getRun(runId);
  if (!run) throw new Error("Run not found");
  return run;
}

export async function listRuns(query: unknown) {
  const q = ListRunsQuerySchema.parse(query);
  return repo.listRuns(q);
}

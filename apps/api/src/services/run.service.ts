import { z } from "zod";
import * as repo from "../repositories/run.repo";

const ObjectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "invalid id");

export async function createRun(projectId: string) {
  ObjectIdSchema.parse(projectId);
  return repo.createRun(projectId);
}

export async function getRun(runId: string) {
  ObjectIdSchema.parse(runId);
  const run = await repo.getRun(runId);
  if (!run) throw new Error("Run not found");
  return run;
}
import { z } from "zod";
import * as repo from "../repositories/project.repo";

const CreateProjectSchema = z.object({
  name: z.string().min(1, "name is required"),
  repoUrl: z.string().url("repoUrl must be a valid URL"),
});

export async function createProject(body: unknown) {
  const data = CreateProjectSchema.parse(body);
  return repo.createProject(data);
}

export async function listProjects() {
  return repo.listProjects();
}
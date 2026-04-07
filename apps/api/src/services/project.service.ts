import { z } from "zod";
import * as repo from "../repositories/project.repo";

const CreateProjectSchema = z.object({
  name: z.string().min(1, "name is required"),
  repoUrl: z.string().url("repoUrl must be a valid URL"),
});

function normalizeRepoUrl(raw: string) {
  const trimmed = raw.trim();
  const noSlash = trimmed.replace(/\/+$/, "");
  return noSlash.replace(/\.git$/i, "");
}

export async function createProject(body: unknown) {
  const data = CreateProjectSchema.parse(body);

  const normalizedRepoUrl = normalizeRepoUrl(data.repoUrl);
  const existing = await repo.findByRepoUrl(normalizedRepoUrl);
  if (existing) {
    throw new Error("Project repoUrl already exists");
  }

  return repo.createProject({
    name: data.name.trim(),
    repoUrl: normalizedRepoUrl,
  });
}

export async function listProjects() {
  return repo.listProjects();
}

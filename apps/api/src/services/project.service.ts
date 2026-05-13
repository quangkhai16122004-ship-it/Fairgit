import { z } from "zod";
import * as repo from "../repositories/project.repo";
import { Run } from "../models/Run";
import { Result } from "../models/Result";

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

const UpdateProjectSchema = z.object({
  name: z.string().min(1, "name is required").optional(),
  repoUrl: z.string().url("repoUrl must be a valid URL").optional(),
});

export async function updateProject(id: string, body: unknown) {
  const data = UpdateProjectSchema.parse(body);

  const patch: Record<string, string> = {};
  if (data.name) patch.name = data.name.trim();
  if (data.repoUrl) {
    const normalized = normalizeRepoUrl(data.repoUrl);
    const conflict = await repo.findByRepoUrl(normalized);
    if (conflict && String(conflict._id) !== id) {
      throw new Error("repoUrl đã tồn tại ở project khác");
    }
    patch.repoUrl = normalized;
  }

  const updated = await repo.updateProject(id, patch);
  if (!updated) throw new Error("Project không tồn tại");
  return updated;
}

export async function deleteProject(id: string) {
  const project = await repo.findById(id);
  if (!project) throw new Error("Project không tồn tại");

  // Cascade: xóa tất cả runs và results thuộc project này
  await Result.deleteMany({ projectId: id });
  await Run.deleteMany({ projectId: id });
  await repo.deleteProject(id);
}

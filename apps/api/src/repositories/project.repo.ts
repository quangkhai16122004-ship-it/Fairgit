import { Project, ProjectDoc } from "../models/Project";

export async function createProject(input: Pick<ProjectDoc, "name" | "repoUrl">) {
  return Project.create(input);
}

export async function listProjects() {
  return Project.find().sort({ createdAt: -1 }).lean();
}

export async function findById(id: string) {
  return Project.findById(id).lean();
}

export async function findByRepoUrl(repoUrl: string) {
  return Project.findOne({ repoUrl }).lean();
}

export async function updateProject(id: string, input: Partial<Pick<ProjectDoc, "name" | "repoUrl">>) {
  return Project.findByIdAndUpdate(id, input, { new: true }).lean();
}

export async function deleteProject(id: string) {
  return Project.findByIdAndDelete(id);
}

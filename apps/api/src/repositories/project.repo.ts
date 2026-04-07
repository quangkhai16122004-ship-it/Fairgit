import { Project, ProjectDoc } from "../models/Project";

export async function createProject(input: Pick<ProjectDoc, "name" | "repoUrl">) {
  return Project.create(input);
}

export async function listProjects() {
  return Project.find().sort({ createdAt: -1 }).lean();
}

export async function findByRepoUrl(repoUrl: string) {
  return Project.findOne({ repoUrl }).lean();
}

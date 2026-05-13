import { api } from "./api";

export type Project = {
  _id: string;
  name: string;
  repoUrl: string;
  createdAt: string;
  updatedAt: string;
};

export async function listProjects() {
  const res = await api.get("/projects");
  // API của bạn có thể trả mảng hoặc object; xử lý cả 2
  return (Array.isArray(res.data) ? res.data : res.data.value) as Project[];
}

export async function createProject(input: { name: string; repoUrl: string }) {
  const res = await api.post("/projects", input);
  return res.data as Project;
}

export async function updateProject(id: string, input: { name?: string; repoUrl?: string }) {
  const res = await api.patch(`/projects/${id}`, input);
  return res.data as Project;
}

export async function deleteProject(id: string) {
  await api.delete(`/projects/${id}`);
}
import { api } from "./api";

export type RunStatus = "pending" | "running" | "done" | "failed";

export type Run = {
  _id: string;
  projectId: string;
  status: RunStatus;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
};

export async function listRuns() {
  const { data } = await api.get<Run[]>("/runs");
  return data;
}

export async function getRun(id: string) {
  const { data } = await api.get<Run>(`/runs/${id}`);
  return data;
}

export async function createRun(projectId: string) {
  const { data } = await api.post<Run>(`/projects/${projectId}/runs`);
  return data;
}
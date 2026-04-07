import { api } from "./api";

export type RunStatus = "pending" | "running" | "done" | "failed";

export type Run = {
  _id: string;
  projectId: string;
  status: RunStatus;
  error?: string | null;
  progress?: number;
  totalCommits?: number;
  totalContributors?: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
};

export type RunsResponse = {
  items: Run[];
  total: number;
  limit: number;
  offset: number;
};

export async function listRuns(params?: {
  projectId?: string;
  status?: RunStatus;
  limit?: number;
  offset?: number;
}) {
  const { data } = await api.get<RunsResponse | Run[]>("/runs", { params });

  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
      limit: params?.limit ?? data.length,
      offset: params?.offset ?? 0,
    } satisfies RunsResponse;
  }

  return {
    items: data.items ?? [],
    total: data.total ?? 0,
    limit: data.limit ?? (params?.limit ?? 0),
    offset: data.offset ?? (params?.offset ?? 0),
  } satisfies RunsResponse;
}

export async function getRun(id: string) {
  const { data } = await api.get<Run>(`/runs/${id}`);
  return data;
}

export async function createRun(projectId: string) {
  const { data } = await api.post<Run>(`/projects/${projectId}/runs`);
  return data;
}

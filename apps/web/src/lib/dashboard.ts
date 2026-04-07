import { api } from "./api"; // file axios instance của bạn (thường đã có)

export type DashboardSummary = {
  projectsCount: number;
  runsCount: number;
  statusCounts: {
    pending: number;
    running: number;
    done: number;
    failed: number;
  };
  latestRun: null | {
    _id: string;
    projectId: string;
    status: "pending" | "running" | "done" | "failed";
    createdAt: string;
    updatedAt: string;
    progress?: number;
    error?: string | null;
  };
  latestDoneRun?: null | {
    _id: string;
    projectId: string;
    status: "pending" | "running" | "done" | "failed";
    createdAt: string;
    updatedAt: string;
    error?: string | null;
  };
  topContributors: Array<{
    _id: string;
    runId: string;
    projectId: string;
    authorEmail: string;
    authorName: string;
    commitCount: number;
    scoreTotal: number;
    scoreConsistency: number;
    scoreImpact: number;
    scoreClean: number;
    scoreConfidence?: number;
    coreTouches: number;
    noiseTouches: number;
    totalTouches?: number;
  }>;
};

export async function getDashboardSummary() {
  const { data } = await api.get<DashboardSummary>("/dashboard/summary");
  return data;
}

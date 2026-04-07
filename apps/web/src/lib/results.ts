import { api } from "./api";

export type EvidenceCommit = {
  hash: string;
  coreFiles: number;
  noiseFiles: number;
  totalFiles: number;
  changedLines?: number;
  subject?: string;
};

export type TopFile = {
  path: string;
  touches: number;
  tag: string;
  changedLines?: number;
};

export type ResultRow = {
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
  spamPenalty?: number;
  activeDays?: number;
  activeWeeks?: number;
  tinyCommitCount?: number;
  impactRaw?: number;

  coreTouches: number;
  testTouches?: number;
  docTouches?: number;
  otherTouches?: number;
  noiseTouches: number;
  totalTouches?: number;

  evidenceCommits: EvidenceCommit[];
  topFiles: TopFile[];

  createdAt: string;
  updatedAt: string;
};

export type ResultsResponse = {
  items: ResultRow[];
  total: number;
  limit: number;
  offset: number;
};

export async function getResults(
  runId: string,
  params?: {
    limit?: number;
    offset?: number;
    q?: string;
    sortBy?: "scoreTotal" | "scoreImpact" | "scoreConsistency" | "scoreClean" | "scoreConfidence" | "commitCount";
    sortDir?: "asc" | "desc";
  }
) {
  const res = await api.get(`/runs/${runId}/results`, { params });

  // backward compatibility: API cũ trả array trực tiếp
  if (Array.isArray(res.data)) {
    const items = res.data as ResultRow[];
    return {
      items,
      total: items.length,
      limit: params?.limit ?? items.length,
      offset: params?.offset ?? 0,
    } satisfies ResultsResponse;
  }

  const data = res.data as ResultsResponse;
  return {
    items: data.items ?? [],
    total: data.total ?? 0,
    limit: data.limit ?? (params?.limit ?? 0),
    offset: data.offset ?? (params?.offset ?? 0),
  } satisfies ResultsResponse;
}

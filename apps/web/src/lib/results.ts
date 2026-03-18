import { api } from "./api";

export type EvidenceCommit = {
  hash: string;
  coreFiles: number;
  noiseFiles: number;
  totalFiles: number;
};

export type TopFile = {
  path: string;
  touches: number;
  tag: string;
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

export async function getResults(runId: string) {
  const res = await api.get(`/runs/${runId}/results`);
  return res.data as ResultRow[];
}

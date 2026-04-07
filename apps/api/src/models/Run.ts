import { Schema, model, Types } from "mongoose";

export type RunStatus = "pending" | "running" | "done" | "failed";

export type RunDoc = {
  projectId: Types.ObjectId;
  status: RunStatus;
  startedAt?: Date;
  finishedAt?: Date;
  error?: string;
  progress: number;
  totalCommits?: number;
  totalContributors?: number;
  createdAt: Date;
  updatedAt: Date;
};

const RunSchema = new Schema<RunDoc>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    status: { type: String, required: true, enum: ["pending", "running", "done", "failed"] },
    startedAt: { type: Date },
    finishedAt: { type: Date },
    error: { type: String },
    progress: { type: Number, required: true, min: 0, max: 100, default: 0 },
    totalCommits: { type: Number, min: 0 },
    totalContributors: { type: Number, min: 0 },
  },
  { timestamps: true }
);

RunSchema.index({ projectId: 1, createdAt: -1 });
RunSchema.index({ status: 1, createdAt: -1 });

export const Run = model<RunDoc>("Run", RunSchema);

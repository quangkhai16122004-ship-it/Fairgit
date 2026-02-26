import { Schema, model, Types } from "mongoose";

export type RunStatus = "pending" | "running" | "done" | "failed";

export type RunDoc = {
  projectId: Types.ObjectId;
  status: RunStatus;
  startedAt?: Date;
  finishedAt?: Date;
  error?: string;
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
  },
  { timestamps: true }
);

export const Run = model<RunDoc>("Run", RunSchema);
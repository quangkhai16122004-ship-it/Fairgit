import { Schema, model, Types } from "mongoose";

export type ResultDoc = {
    runId: Types.ObjectId;
    projectId: Types.ObjectId;
    authorEmail: string;
    authorName: string;
    commitCount: number;
    createdAt: Date;
    updatedAt: Date;
    scoreTotal: number;
    scoreConsistency: number;
    scoreImpact: number;
    scoreClean: number;
};

const ResultSchema = new Schema<ResultDoc>(
  {
    runId: { type: Schema.Types.ObjectId, ref: "Run", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },

    authorEmail: { type: String, required: true, trim: true },
    authorName: { type: String, required: true, trim: true },

    commitCount: { type: Number, required: true, min: 0 },

    scoreTotal: { type: Number, required: true, min: 0, default: 0 },
    scoreConsistency: { type: Number, required: true, min: 0, default: 0 },
    scoreImpact: { type: Number, required: true, min: 0, default: 0 },
    scoreClean: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true }
  
);

ResultSchema.index({ runId: 1, authorEmail: 1 }, { unique: true });

export const Result = model<ResultDoc>("Result", ResultSchema);
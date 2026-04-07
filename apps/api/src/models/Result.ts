import { Schema, model, Types } from "mongoose";

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
  tag: string; // "core" | "noise" | "test" | "doc" | "other"
  changedLines?: number;
};

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
  scoreConfidence: number;
  spamPenalty: number;
  activeDays: number;
  activeWeeks: number;
  tinyCommitCount: number;
  impactRaw: number;

  coreTouches: number;
  testTouches: number;
  docTouches: number;
  otherTouches: number;
  noiseTouches: number;
  totalTouches: number;

  evidenceCommits: EvidenceCommit[];
  topFiles: TopFile[];
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
    scoreConfidence: { type: Number, required: true, min: 0, max: 100, default: 0 },
    spamPenalty: { type: Number, required: true, min: 0, default: 0 },
    activeDays: { type: Number, required: true, min: 0, default: 0 },
    activeWeeks: { type: Number, required: true, min: 0, default: 0 },
    tinyCommitCount: { type: Number, required: true, min: 0, default: 0 },
    impactRaw: { type: Number, required: true, min: 0, default: 0 },
    coreTouches: { type: Number, required: true, min: 0, default: 0 },
    testTouches: { type: Number, required: true, min: 0, default: 0 },
    docTouches: { type: Number, required: true, min: 0, default: 0 },
    otherTouches: { type: Number, required: true, min: 0, default: 0 },
    noiseTouches: { type: Number, required: true, min: 0, default: 0 },
    totalTouches: { type: Number, required: true, min: 0, default: 0 },

    evidenceCommits: [
      {
        hash: { type: String, required: true },
        coreFiles: { type: Number, required: true, min: 0 },
        noiseFiles: { type: Number, required: true, min: 0 },
        totalFiles: { type: Number, required: true, min: 0 },
        changedLines: { type: Number, required: false, min: 0 },
        subject: { type: String, required: false },
      },
    ],

    topFiles: [
      {
        path: { type: String, required: true },
        touches: { type: Number, required: true, min: 0 },
        tag: { type: String, required: true },
        changedLines: { type: Number, required: false, min: 0 },
      },
    ],
  },
  { timestamps: true }
  
);

ResultSchema.index({ runId: 1, authorEmail: 1 }, { unique: true });
ResultSchema.index({ runId: 1, scoreTotal: -1 });
ResultSchema.index({ runId: 1, scoreImpact: -1 });

export const Result = model<ResultDoc>("Result", ResultSchema);

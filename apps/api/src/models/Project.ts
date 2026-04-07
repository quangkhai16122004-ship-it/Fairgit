import { Schema, model } from "mongoose";

export type ProjectDoc = {
  name: string;
  repoUrl: string;
  createdAt: Date;
  updatedAt: Date;
};

const ProjectSchema = new Schema<ProjectDoc>(
  {
    name: { type: String, required: true, trim: true },
    repoUrl: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

ProjectSchema.index({ repoUrl: 1 });

export const Project = model<ProjectDoc>("Project", ProjectSchema);

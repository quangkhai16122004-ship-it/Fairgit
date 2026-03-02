import dotenv from "dotenv";
import mongoose from "mongoose";
import { ensureRepo, getRecentCommits } from "./commitExtract";
import { getTouchedFiles } from "./fileTouch";

dotenv.config();

async function main() {
  const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/fairgit";
  await mongoose.connect(MONGO_URI);

  // lấy 1 project bất kỳ từ DB để test
  const ProjectSchema = new mongoose.Schema(
    { name: String, repoUrl: String },
    { timestamps: true, collection: "projects" }
  );
  const Project = mongoose.model("Project", ProjectSchema);

  const project = await Project.findOne().lean();
  if (!project?.repoUrl) throw new Error("No project found");

  const repoDir = await ensureRepo(project.repoUrl);
  const commits = await getRecentCommits(repoDir, 30);
  if (commits.length === 0) throw new Error("No commits");

  const first = commits[0];
  console.log("Testing commit:", first.hash, first.authorEmail);

  const files = await getTouchedFiles(repoDir, first.hash);
  console.log("Touched files count:", files.length);
  console.log(files.slice(0, 15)); // in thử 15 file đầu
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
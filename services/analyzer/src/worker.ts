import dotenv from "dotenv";
import mongoose from "mongoose";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { ensureRepo, getRecentCommits } from "./commitExtract";
import { scoreFromCommits } from "./scoring";
import { scoreFromCommitsWithFiles } from "./scoreByFiles";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/fairgit";

const connection = new IORedis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT || 6379),
  maxRetriesPerRequest: null,
});

// Mongoose schema tối thiểu cho Run để update status
const RunSchema = new mongoose.Schema(
  {
    projectId: mongoose.Schema.Types.ObjectId,
    status: String,
    startedAt: Date,
    finishedAt: Date,
    error: String,
  },
  { timestamps: true, collection: "runs" }
);

const Run = mongoose.model("Run", RunSchema);

const ResultSchema = new mongoose.Schema(
  {
    runId: mongoose.Schema.Types.ObjectId,
    projectId: mongoose.Schema.Types.ObjectId,
    authorEmail: String,
    authorName: String,
    commitCount: Number,

    scoreConsistency: Number,
    scoreImpact: Number,
    scoreClean: Number,
    scoreTotal: Number,

    coreTouches: Number,
    noiseTouches: Number,
  },
  { timestamps: true, collection: "results" }
);

const Result = mongoose.model("Result", ResultSchema);

async function start() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Analyzer connected to MongoDB");

  const worker = new Worker(
    "analysis",
    async (job) => {
      const { runId, projectId } = job.data as { runId: string; projectId: string };

      const runObjectId = new mongoose.Types.ObjectId(runId);
      const projectObjectId = new mongoose.Types.ObjectId(projectId);

      // mark running
      await Run.findByIdAndUpdate(runObjectId, { status: "running", startedAt: new Date(), error: null });

      // lấy repoUrl từ Project
      const ProjectSchema = new mongoose.Schema(
        { name: String, repoUrl: String },
        { timestamps: true, collection: "projects" }
      );
      const Project = mongoose.model("Project", ProjectSchema);

      const project = await Project.findById(projectObjectId).lean();
      if (!project?.repoUrl) throw new Error("Project repoUrl not found");

      // 1) đảm bảo repo đã có (clone/fetch)
      const repoDir = await ensureRepo(project.repoUrl);

      // 2) lấy commit 90 ngày gần nhất
      const commits = await getRecentCommits(repoDir, 90);

      // 3) chấm điểm từ danh sách commit
      const rows = await scoreFromCommitsWithFiles(repoDir, commits);

      // xóa kết quả cũ của run này (nếu chạy lại)
      await Result.deleteMany({ runId: runObjectId });

      // lưu kết quả mới
      if (rows.length > 0) {
        await Result.insertMany(
          rows.map((r) => ({
            runId: runObjectId,
            projectId: projectObjectId,
            authorEmail: r.authorEmail,
            authorName: r.authorName,
            commitCount: r.commitCount,
            scoreConsistency: r.scoreConsistency,
            scoreImpact: r.scoreImpact,
            scoreClean: r.scoreClean,
            scoreTotal: r.scoreTotal,
            coreTouches: r.coreTouches,
            noiseTouches: r.noiseTouches,
          }))
        );
      }

      // mark done
      await Run.findByIdAndUpdate(runObjectId, { status: "done", finishedAt: new Date() });

      console.log("✅ Done run:", runId);
    },
    { connection }
  );

  worker.on("failed", async (job, err) => {
    console.error("❌ Job failed:", job?.id, err);
    if (job?.data?.runId) {
      await Run.findByIdAndUpdate(job.data.runId, { status: "failed", error: err.message, finishedAt: new Date() });
    }
  });

  console.log("✅ Analyzer worker is listening...");
}

start().catch((err) => {
  console.error("❌ Analyzer failed to start:", err);
  process.exit(1);
});
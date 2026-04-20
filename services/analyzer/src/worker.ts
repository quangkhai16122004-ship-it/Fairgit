import mongoose from "mongoose";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { ensureRepo, getRecentCommits } from "./commitExtract";
import { scoreFromCommitsWithFiles } from "./scoreByFiles";
import { env } from "./env";

const connection = env.REDIS_URL
  ? new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null })
  : new IORedis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
    });

// Schema tối thiểu để analyzer cập nhật tiến độ mà không phụ thuộc chặt vào API package.
const RunSchema = new mongoose.Schema(
  {
    projectId: mongoose.Schema.Types.ObjectId,
    status: String,
    startedAt: Date,
    finishedAt: Date,
    error: String,
    progress: Number,
    totalCommits: Number,
    totalContributors: Number,
  },
  { timestamps: true, collection: "runs", strict: false }
);

const ResultSchema = new mongoose.Schema(
  {},
  { timestamps: true, collection: "results", strict: false }
);

const ProjectSchema = new mongoose.Schema(
  { name: String, repoUrl: String },
  { timestamps: true, collection: "projects", strict: false }
);

const Run = mongoose.models.Run || mongoose.model("Run", RunSchema);
const Result = mongoose.models.Result || mongoose.model("Result", ResultSchema);
const Project = mongoose.models.Project || mongoose.model("Project", ProjectSchema);

async function setRunProgress(runObjectId: mongoose.Types.ObjectId, patch: Record<string, unknown>) {
  await Run.findByIdAndUpdate(runObjectId, patch);
}

async function start() {
  await mongoose.connect(env.MONGO_URI);
  console.log("✅ Analyzer connected to MongoDB");

  const worker = new Worker(
    "analysis",
    async (job) => {
      const { runId, projectId } = job.data as { runId: string; projectId: string };
      const runObjectId = new mongoose.Types.ObjectId(runId);
      const projectObjectId = new mongoose.Types.ObjectId(projectId);

      await setRunProgress(runObjectId, {
        status: "running",
        startedAt: new Date(),
        finishedAt: null,
        error: null,
        progress: 5,
      });

      const project = await Project.findById(projectObjectId).lean();
      if (!project?.repoUrl) {
        throw new Error("Project repoUrl not found");
      }

      const repoDir = await ensureRepo(project.repoUrl);
      await setRunProgress(runObjectId, { progress: 20 });

      const commits = await getRecentCommits(repoDir, env.ANALYSIS_LOOKBACK_DAYS, env.ANALYSIS_MAX_COMMITS);
      await setRunProgress(runObjectId, { progress: 40, totalCommits: commits.length });

      const rows = await scoreFromCommitsWithFiles(repoDir, commits);
      await setRunProgress(runObjectId, { progress: 75, totalContributors: rows.length });

      await Result.deleteMany({ runId: runObjectId });

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
            scoreConfidence: r.scoreConfidence,
            spamPenalty: r.spamPenalty,
            activeDays: r.activeDays,
            activeWeeks: r.activeWeeks,
            tinyCommitCount: r.tinyCommitCount,
            impactRaw: r.impactRaw,

            coreTouches: r.coreTouches,
            testTouches: r.testTouches,
            docTouches: r.docTouches,
            otherTouches: r.otherTouches,
            noiseTouches: r.noiseTouches,
            totalTouches: r.totalTouches,

            evidenceCommits: r.evidenceCommits,
            topFiles: r.topFiles,
          }))
        );
      }

      await setRunProgress(runObjectId, {
        status: "done",
        finishedAt: new Date(),
        error: null,
        progress: 100,
      });

      console.log(`✅ Done run: ${runId} (${rows.length} contributors, ${commits.length} commits)`);
    },
    {
      connection,
      concurrency: env.ANALYZER_CONCURRENCY,
    }
  );

  worker.on("failed", async (job, err) => {
    console.error("❌ Job failed:", job?.id, err);
    if (job?.data?.runId) {
      await Run.findByIdAndUpdate(job.data.runId, {
        status: "failed",
        error: err.message,
        finishedAt: new Date(),
        progress: 100,
      });
    }
  });

  console.log("✅ Analyzer worker is listening...");
}

start().catch((err) => {
  console.error("❌ Analyzer failed to start:", err);
  process.exit(1);
});

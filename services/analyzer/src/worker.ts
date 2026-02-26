import dotenv from "dotenv";
import mongoose from "mongoose";
import { Worker } from "bullmq";
import IORedis from "ioredis";

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

async function start() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Analyzer connected to MongoDB");

  const worker = new Worker(
    "analysis",
    async (job) => {
      const { runId } = job.data as { runId: string; projectId: string };

      console.log("🔧 Start job:", job.id, "runId:", runId);

      // mark running
      await Run.findByIdAndUpdate(runId, { status: "running", startedAt: new Date(), error: null });

      // giả lập xử lý 2 giây (bước 7 sẽ thay bằng phân tích Git thật)
      await new Promise((r) => setTimeout(r, 2000));

      // mark done
      await Run.findByIdAndUpdate(runId, { status: "done", finishedAt: new Date() });

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
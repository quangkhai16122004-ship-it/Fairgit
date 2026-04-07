import { Queue } from "bullmq";
import IORedis from "ioredis";
import { env } from "./env";

const connection = new IORedis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: null,
});

export const analysisQueue = new Queue("analysis", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 3_000 },
    removeOnComplete: { age: 60 * 60 * 24, count: 1_000 },
    removeOnFail: { age: 60 * 60 * 24 * 7, count: 2_000 },
  },
});

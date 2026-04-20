import { Queue } from "bullmq";
import IORedis from "ioredis";
import { env } from "./env";

const connection = env.REDIS_URL
  ? new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null })
  : new IORedis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD,
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

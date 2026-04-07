import dotenv from "dotenv";

dotenv.config();

function readInt(name: string, fallback: number, min: number, max: number) {
  const raw = process.env[name];
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

export const env = {
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/fairgit",
  REDIS_HOST: process.env.REDIS_HOST || "127.0.0.1",
  REDIS_PORT: readInt("REDIS_PORT", 6379, 1, 65535),
  ANALYZER_CONCURRENCY: readInt("ANALYZER_CONCURRENCY", 1, 1, 16),
  ANALYSIS_LOOKBACK_DAYS: readInt("ANALYSIS_LOOKBACK_DAYS", 90, 7, 365),
  ANALYSIS_MAX_COMMITS: readInt("ANALYSIS_MAX_COMMITS", 5000, 100, 50000),
};

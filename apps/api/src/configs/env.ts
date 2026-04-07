import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGO_URI: z.string().min(1).default("mongodb://localhost:27017/fairgit"),

  REDIS_HOST: z.string().min(1).default("127.0.0.1"),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),

  CORS_ORIGIN: z.string().min(1).default("http://localhost:5173"),
  JWT_SECRET: z.string().min(12).default("dev_secret_change_me_unsafe"),
  AUTH_COOKIE_NAME: z.string().min(1).default("fg_token"),
  AUTH_COOKIE_SECURE: z.enum(["true", "false"]).default("false"),
  AUTH_COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
  AUTH_EXPIRES_IN: z.string().min(1).default("8h"),

  LOGIN_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
  API_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  API_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const message = parsed.error.issues.map((x) => `${x.path.join(".")}: ${x.message}`).join("; ");
  throw new Error(`Invalid API env: ${message}`);
}

export const env = {
  ...parsed.data,
  authCookieSecure: parsed.data.AUTH_COOKIE_SECURE === "true",
};

if (env.NODE_ENV === "production" && env.JWT_SECRET.includes("dev_secret")) {
  throw new Error("JWT_SECRET must be replaced in production");
}

export type Env = typeof env;

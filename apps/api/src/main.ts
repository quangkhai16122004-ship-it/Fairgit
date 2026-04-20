import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";

import { projectRouter } from "./routes/project.routes";
import { runRouter } from "./routes/run.routes";
import { resultRouter } from "./routes/result.routes";
import { dashboardRouter } from "./routes/dashboard.routes";
import { env } from "./configs/env";
import { requestLog } from "./middlewares/requestLog";
import { createRateLimiter } from "./middlewares/rateLimit";

const app = express();
const allowedCorsOrigins = new Set(env.corsOrigins);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedOrigin = origin.replace(/\/+$/, "");
      if (allowedCorsOrigins.has(normalizedOrigin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

app.disable("x-powered-by");
app.use((_, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});
app.use(requestLog);
app.use(createRateLimiter(env.API_RATE_LIMIT_WINDOW_MS, env.API_RATE_LIMIT_MAX));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));

app.use("/projects", projectRouter);
app.use("/runs", runRouter);
app.use("/runs", resultRouter);
app.use("/auth", authRoutes);
app.use(dashboardRouter);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "api" });
});

const MONGO_URI = env.MONGO_URI;

async function start() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB:", MONGO_URI);

  app.listen(env.PORT, () => {
    console.log(`✅ API listening on http://localhost:${env.PORT}`);
  });
}

start().catch((err) => {
  console.error("❌ Failed to start API:", err);
  process.exit(1);
});

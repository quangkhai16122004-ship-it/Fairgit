import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";

import { projectRouter } from "./routes/project.routes";
import { runRouter } from "./routes/run.routes";
import { resultRouter } from "./routes/result.routes";
import { dashboardRouter } from "./routes/dashboard.routes";

dotenv.config();

const app = express();

app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    })
  );

app.use(cookieParser());
app.use(express.json());

app.use("/projects", projectRouter);
app.use("/runs", runRouter);
app.use("/", resultRouter);
app.use("/auth", authRoutes);
app.use(dashboardRouter);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "api" });
});

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/fairgit";

async function start() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB:", MONGO_URI);

  app.listen(PORT, () => {
    console.log(`✅ API listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("❌ Failed to start API:", err);
  process.exit(1);
});
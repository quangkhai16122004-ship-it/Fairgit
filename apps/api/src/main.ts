import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import { projectRouter } from "./routes/project.routes";
import { runRouter } from "./routes/run.routes";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/projects", projectRouter);
app.use("/runs", runRouter);

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
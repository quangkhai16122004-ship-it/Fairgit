import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "./models/User";

dotenv.config();

async function main() {
  const MONGO_URI = process.env.MONGO_URL || process.env.MONGO_URI || "mongodb://localhost:27017/fairgit";
  await mongoose.connect(MONGO_URI);

  const email = "admin@fairgit.local";
  const password = "Admin123!";
  const passwordHash = await bcrypt.hash(password, 10);

  await User.updateOne(
    { email },
    { $setOnInsert: { email, passwordHash, role: "admin" } },
    { upsert: true }
  );

  console.log("✅ Seeded admin:", email, password);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "./models/User";

dotenv.config();

export async function seedAdmin() {
  const email = "admin@fairgit.local";
  const password = "Admin123!";
  const existing = await User.findOne({ email });
  if (existing) return;
  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ email, passwordHash, role: "admin" });
  console.log("✅ Seeded admin:", email);
}

async function main() {
  const MONGO_URI = process.env.MONGO_URL || process.env.MONGO_URI || "mongodb://localhost:27017/fairgit";
  await mongoose.connect(MONGO_URI);
  await seedAdmin();
  console.log("✅ Seed complete");
  process.exit(0);
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
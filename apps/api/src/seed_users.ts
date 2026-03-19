import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "./models/User";

dotenv.config();

async function upsert(email: string, password: string, role: "admin" | "manager" | "member") {
  const passwordHash = await bcrypt.hash(password, 10);
  await User.updateOne(
    { email },
    { $set: { email, passwordHash, role } },
    { upsert: true }
  );
}

async function main() {
  const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/fairgit";
  await mongoose.connect(MONGO_URI);

  await upsert("manager@fairgit.local", "Manager123!", "manager");
  await upsert("member@fairgit.local", "Member123!", "member");

  console.log("✅ Seeded:");
  console.log("manager@fairgit.local / Manager123!");
  console.log("member@fairgit.local / Member123!");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
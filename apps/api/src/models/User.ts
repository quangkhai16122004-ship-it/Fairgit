import { Schema, model } from "mongoose";

export type Role = "admin" | "manager" | "member";

export type UserDoc = {
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
};

const UserSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ["admin", "manager", "member"], default: "member" },
  },
  { timestamps: true }
);

export const User = model<UserDoc>("User", UserSchema);
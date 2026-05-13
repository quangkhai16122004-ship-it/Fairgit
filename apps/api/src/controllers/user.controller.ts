import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../models/User";
import type { Role } from "../models/User";

const ResetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, "Mật khẩu tối thiểu 8 ký tự")
    .max(128)
    .regex(/[A-Z]/, "Phải có chữ hoa")
    .regex(/[a-z]/, "Phải có chữ thường")
    .regex(/[0-9]/, "Phải có chữ số"),
});

export async function listUsers(_req: Request, res: Response) {
  const users = await User.find({}, { passwordHash: 0 }).sort({ createdAt: -1 }).lean();
  res.json(users);
}

export async function changeRole(req: Request, res: Response) {
  const { id } = req.params;
  const { role } = req.body as { role: Role };

  if (!["admin", "manager", "member"].includes(role)) {
    res.status(400).json({ error: "Role không hợp lệ" });
    return;
  }

  if (req.auth?.userId === id) {
    res.status(400).json({ error: "Không thể tự đổi role của chính mình" });
    return;
  }

  const user = await User.findByIdAndUpdate(id, { role }, { new: true, select: "-passwordHash" });
  if (!user) {
    res.status(404).json({ error: "Không tìm thấy người dùng" });
    return;
  }

  res.json(user);
}

export async function resetPassword(req: Request, res: Response) {
  const { id } = req.params;
  const parsed = ResetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    res.status(400).json({ error: issue?.message ?? "Invalid payload" });
    return;
  }

  const user = await User.findById(id);
  if (!user) {
    res.status(404).json({ error: "Không tìm thấy người dùng" });
    return;
  }

  user.passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await user.save();
  res.json({ ok: true });
}

export async function deleteUser(req: Request, res: Response) {
  const { id } = req.params;

  if (req.auth?.userId === id) {
    res.status(400).json({ error: "Không thể xóa chính mình" });
    return;
  }

  const user = await User.findByIdAndDelete(id);
  if (!user) {
    res.status(404).json({ error: "Không tìm thấy người dùng" });
    return;
  }

  res.json({ ok: true });
}

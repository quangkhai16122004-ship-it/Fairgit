import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../models/User";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const COOKIE_NAME = "fg_token";

router.post("/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) return res.status(400).json({ error: "Missing email/password" });

  const user = await User.findOne({ email: email.toLowerCase() }).lean();
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ sub: String(user._id), role: user.role, email: user.email }, JWT_SECRET, { expiresIn: "1h" });

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // local dev
  });

  return res.json({ ok: true, role: user.role, email: user.email });
});

router.get("/me", async (req, res) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: "Not logged in" });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    return res.json({ ok: true, email: payload.email, role: payload.role });
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
});

router.post("/logout", async (_req, res) => {
  res.clearCookie(COOKIE_NAME);
  return res.json({ ok: true });
});

export default router;
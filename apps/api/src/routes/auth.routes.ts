import { Router, type Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../models/User";
import { env } from "../configs/env";
import { createRateLimiter } from "../middlewares/rateLimit";
import { requireAuth } from "../middlewares/auth";

const router = Router();
const loginRateLimit = createRateLimiter(env.LOGIN_RATE_LIMIT_WINDOW_MS, env.LOGIN_RATE_LIMIT_MAX);
const registerRateLimit = createRateLimiter(env.LOGIN_RATE_LIMIT_WINDOW_MS, env.LOGIN_RATE_LIMIT_MAX);

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(256),
});

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
    .regex(/[A-Z]/, "Password must include at least one uppercase letter")
    .regex(/[a-z]/, "Password must include at least one lowercase letter")
    .regex(/[0-9]/, "Password must include at least one number"),
});

function issueAuthCookie(res: Response, user: { _id: unknown; role: "admin" | "manager" | "member"; email: string }) {
  const token = jwt.sign({ sub: String(user._id), role: user.role, email: user.email }, env.JWT_SECRET, {
    expiresIn: env.AUTH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });

  res.cookie(env.AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: env.AUTH_COOKIE_SAME_SITE,
    secure: env.authCookieSecure,
  });
}

router.post("/register", registerRateLimit, async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return res.status(400).json({ error: issue?.message ?? "Invalid register payload" });
  }

  const email = parsed.data.email.toLowerCase();
  const password = parsed.data.password;

  const exists = await User.findOne({ email }).lean();
  if (exists) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const user = await User.create({
      email,
      passwordHash,
      role: "member",
    });

    issueAuthCookie(res, user);
    return res.status(201).json({ ok: true, role: user.role, email: user.email });
  } catch (err: unknown) {
    const mongoErr = err as { code?: number };
    if (mongoErr?.code === 11000) {
      return res.status(409).json({ error: "Email already registered" });
    }
    return res.status(500).json({ error: "Register failed" });
  }
});

router.post("/login", loginRateLimit, async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid email/password payload" });
  }

  const { email, password } = parsed.data;

  const user = await User.findOne({ email: email.toLowerCase() }).lean();
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  issueAuthCookie(res, user);
  return res.json({ ok: true, role: user.role, email: user.email });
});

router.get("/me", async (req, res) => {
  const token = req.cookies?.[env.AUTH_COOKIE_NAME];
  if (!token) return res.status(401).json({ error: "Not logged in" });

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { email: string; role: "admin" | "manager" | "member" };
    return res.json({ ok: true, email: payload.email, role: payload.role });
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
});

router.post("/logout", async (_req, res) => {
  res.clearCookie(env.AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: env.AUTH_COOKIE_SAME_SITE,
    secure: env.authCookieSecure,
  });
  return res.json({ ok: true });
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8, "Mật khẩu tối thiểu 8 ký tự")
    .max(128)
    .regex(/[A-Z]/, "Phải có chữ hoa")
    .regex(/[a-z]/, "Phải có chữ thường")
    .regex(/[0-9]/, "Phải có chữ số"),
});

router.patch("/password", requireAuth, async (req, res) => {
  const parsed = ChangePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return res.status(400).json({ error: issue?.message ?? "Invalid payload" });
  }

  const user = await User.findById(req.auth!.userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!ok) return res.status(400).json({ error: "Mật khẩu hiện tại không đúng" });

  user.passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await user.save();

  return res.json({ ok: true });
});

export default router;

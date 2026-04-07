import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../configs/env";
import type { Role } from "../models/User";

const JwtPayloadSchema = z.object({
  sub: z.string().min(1),
  role: z.enum(["admin", "manager", "member"]),
  email: z.string().email(),
});

function decodeToken(token: string) {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  const parsed = JwtPayloadSchema.safeParse(decoded);
  if (!parsed.success) {
    throw new Error("Invalid token payload");
  }
  return parsed.data;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[env.AUTH_COOKIE_NAME];
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const payload = decodeToken(token);
    req.auth = {
      userId: payload.sub,
      role: payload.role,
      email: payload.email,
    };
    next();
  } catch {
    res.status(401).json({ error: "Invalid auth token" });
  }
}

export function requireRoles(allow: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.auth?.role;
    if (!role) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    if (!allow.includes(role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}

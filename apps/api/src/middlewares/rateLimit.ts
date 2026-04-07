import type { NextFunction, Request, Response } from "express";

type Counter = { count: number; windowStart: number };

export function createRateLimiter(windowMs: number, maxRequests: number) {
  const bucket = new Map<string, Counter>();

  return function rateLimit(req: Request, res: Response, next: NextFunction) {
    const key = req.ip ?? "unknown";
    const now = Date.now();
    const cur = bucket.get(key);

    if (!cur || now - cur.windowStart >= windowMs) {
      bucket.set(key, { count: 1, windowStart: now });
      next();
      return;
    }

    cur.count += 1;
    if (cur.count > maxRequests) {
      res.status(429).json({
        error: "Too many requests",
        retryAfterMs: Math.max(0, windowMs - (now - cur.windowStart)),
      });
      return;
    }

    next();
  };
}

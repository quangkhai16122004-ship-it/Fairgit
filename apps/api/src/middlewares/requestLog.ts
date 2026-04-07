import type { NextFunction, Request, Response } from "express";

function nowMs() {
  return Date.now();
}

export function requestLog(req: Request, res: Response, next: NextFunction) {
  const started = nowMs();
  const method = req.method;
  const path = req.originalUrl || req.url;

  res.on("finish", () => {
    const elapsed = nowMs() - started;
    const status = res.statusCode;
    const ip = req.ip ?? "-";
    console.log(`[api] ${method} ${path} ${status} ${elapsed}ms ip=${ip}`);
  });

  next();
}

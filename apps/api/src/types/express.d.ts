import type { Role } from "../models/User";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        role: Role;
        email: string;
      };
    }
  }
}

export {};

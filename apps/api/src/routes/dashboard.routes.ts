import { Router } from "express";
import * as controller from "../controllers/dashboard.controller";
import { requireAuth } from "../middlewares/auth";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

// GET /dashboard/summary
dashboardRouter.get("/dashboard/summary", controller.summary);

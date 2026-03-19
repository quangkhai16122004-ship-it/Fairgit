import { Router } from "express";
import * as controller from "../controllers/dashboard.controller";

export const dashboardRouter = Router();

// GET /dashboard/summary
dashboardRouter.get("/dashboard/summary", controller.summary);
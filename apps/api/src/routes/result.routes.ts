import { Router } from "express";
import * as controller from "../controllers/result.controller";
import { requireAuth } from "../middlewares/auth";

export const resultRouter = Router();
resultRouter.use(requireAuth);
resultRouter.get("/:runId/results", controller.listByRun);

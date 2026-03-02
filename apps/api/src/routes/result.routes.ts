import { Router } from "express";
import * as controller from "../controllers/result.controller";

export const resultRouter = Router();
resultRouter.get("/runs/:runId/results", controller.listByRun);
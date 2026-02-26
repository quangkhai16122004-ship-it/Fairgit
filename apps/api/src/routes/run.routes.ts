import { Router } from "express";
import * as controller from "../controllers/run.controller";

export const runRouter = Router();

runRouter.get("/:runId", controller.getRun);
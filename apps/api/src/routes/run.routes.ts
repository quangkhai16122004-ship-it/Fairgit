import { Router } from "express";
import * as controller from "../controllers/run.controller";
import { requireAuth, requireRoles } from "../middlewares/auth";

export const runRouter = Router();
runRouter.use(requireAuth);

runRouter.get("/", controller.listRuns);
runRouter.get("/:runId", controller.getRun);
runRouter.delete("/:runId", requireRoles(["admin"]), controller.deleteRun);

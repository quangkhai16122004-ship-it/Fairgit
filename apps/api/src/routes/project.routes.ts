import { Router } from "express";
import * as controller from "../controllers/project.controller";
import * as runController from "../controllers/run.controller";
import { requireAuth, requireRoles } from "../middlewares/auth";

export const projectRouter = Router();

projectRouter.use(requireAuth);
projectRouter.get("/", controller.listProjects);
projectRouter.post("/", requireRoles(["admin", "manager"]), controller.createProject);

projectRouter.post("/:projectId/runs", requireRoles(["admin", "manager"]), runController.createRun);

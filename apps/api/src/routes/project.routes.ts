import { Router } from "express";
import * as controller from "../controllers/project.controller";
import * as runController from "../controllers/run.controller";

export const projectRouter = Router();

projectRouter.post("/", controller.createProject);
projectRouter.get("/", controller.listProjects);

projectRouter.post("/:projectId/runs", runController.createRun);
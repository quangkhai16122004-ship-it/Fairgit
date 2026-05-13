import { Router } from "express";
import { requireAuth, requireRoles } from "../middlewares/auth";
import * as controller from "../controllers/user.controller";

export const userRouter = Router();

userRouter.use(requireAuth);
userRouter.use(requireRoles(["admin"]));

userRouter.get("/", controller.listUsers);
userRouter.patch("/:id/role", controller.changeRole);
userRouter.patch("/:id/password", controller.resetPassword);
userRouter.delete("/:id", controller.deleteUser);

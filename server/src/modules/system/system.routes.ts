import { Router } from "express";
import { getSystemStackController } from "./system.controller";

export const systemRouter = Router();

systemRouter.get("/stack", getSystemStackController);

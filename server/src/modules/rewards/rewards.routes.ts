import { Router } from "express";
import { getWeeklyRewardPreviewController } from "./rewards.controller";

export const rewardsRouter = Router();

rewardsRouter.get("/weekly-preview", getWeeklyRewardPreviewController);
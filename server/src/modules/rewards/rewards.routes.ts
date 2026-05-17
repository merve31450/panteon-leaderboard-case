import { Router } from "express";
import {
  distributeWeeklyRewardsController,
  getWeeklyRewardPreviewController
} from "./rewards.controller";

export const rewardsRouter = Router();

rewardsRouter.get("/weekly-preview", getWeeklyRewardPreviewController);
rewardsRouter.post("/distribute-weekly", distributeWeeklyRewardsController);

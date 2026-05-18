import { Router } from "express";
import {
  distributeWeeklyRewardsController,
  getWeeklyRewardPreviewController
} from "./rewards.controller";
import { adminAuth } from "../../middlewares/adminAuth";

export const rewardsRouter = Router();

rewardsRouter.get("/weekly-preview", getWeeklyRewardPreviewController);
rewardsRouter.post(
  "/distribute-weekly",
  adminAuth,
  distributeWeeklyRewardsController
);

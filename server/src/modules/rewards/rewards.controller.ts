import { Request, Response } from "express";
import {
  distributeWeeklyRewards,
  getWeeklyRewardPreview
} from "./rewards.service";

export async function getWeeklyRewardPreviewController(
  _req: Request,
  res: Response
) {
  const rewardPreview = await getWeeklyRewardPreview();

  return res.json({
    success: true,
    data: rewardPreview
  });
}

export async function distributeWeeklyRewardsController(
  _req: Request,
  res: Response
) {
  try {
    const distributedRewards = await distributeWeeklyRewards();

    return res.json({
      success: true,
      data: distributedRewards
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Weekly reward distribution is already in progress"
    ) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    throw error;
  }
}

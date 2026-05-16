import { Request, Response } from "express";
import { getWeeklyRewardPreview } from "./rewards.service";

export function getWeeklyRewardPreviewController(
  _req: Request,
  res: Response
) {
  const rewardPreview = getWeeklyRewardPreview();

  return res.json({
    success: true,
    data: rewardPreview
  });
}
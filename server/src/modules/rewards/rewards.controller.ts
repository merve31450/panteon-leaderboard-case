import { Request, Response } from "express";
import { getWeeklyRewardPreview } from "./rewards.service";

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

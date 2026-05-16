import { Request, Response } from "express";
import {
  getPlayerLeaderboardContext,
  getPlayerLeaderboardContextFromRedis,
  getTopLeaderboard,
  getTopLeaderboardFromRedis,
  seedLeaderboardToRedis
} from "./leaderboard.service";

export function getTopLeaderboardController(req: Request, res: Response) {
  const limit = Number(req.query.limit || 100);

  const leaderboard = getTopLeaderboard(limit);

  return res.json({
    success: true,
    data: leaderboard
  });
}

export function getPlayerLeaderboardContextController(
  req: Request,
  res: Response
) {
  const playerId = String(req.params.playerId);

  const context = getPlayerLeaderboardContext(playerId);

  if (!context) {
    return res.status(404).json({
      success: false,
      message: "Player not found in leaderboard"
    });
  }

  return res.json({
    success: true,
    data: context
  });
}
export async function seedLeaderboardController(_req: Request, res: Response) {
  const result = await seedLeaderboardToRedis();

  return res.status(201).json({
    success: true,
    data: result
  });
}

export async function getTopLeaderboardFromRedisController(
  req: Request,
  res: Response
) {
  const limit = Number(req.query.limit || 100);

  const leaderboard = await getTopLeaderboardFromRedis(limit);

  return res.json({
    success: true,
    data: leaderboard
  });
}

export async function getPlayerLeaderboardContextFromRedisController(
  req: Request,
  res: Response
) {
  const playerId = String(req.params.playerId);

  const context = await getPlayerLeaderboardContextFromRedis(playerId);

  if (!context) {
    return res.status(404).json({
      success: false,
      message: "Player not found in Redis leaderboard"
    });
  }

  return res.json({
    success: true,
    data: context
  });
}
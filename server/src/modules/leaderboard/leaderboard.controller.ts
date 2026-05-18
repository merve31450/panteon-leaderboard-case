import { Request, Response } from "express";
import {
  getPlayerLeaderboardContext,
  getPlayerLeaderboardContextFromRedis,
  getTopLeaderboard,
  getTopLeaderboardFromRedis,
  DEFAULT_LARGE_SEED_COUNT,
  MAX_LARGE_SEED_COUNT,
  seedLargeLeaderboardToRedis,
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
  try {
    const result = await seedLeaderboardToRedis();

    return res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Failed to seed Redis leaderboard:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to seed leaderboard"
    });
  }
}

export async function seedLargeLeaderboardController(
  req: Request,
  res: Response
) {
  const rawCount = req.query.count;
  const count =
    rawCount === undefined ? DEFAULT_LARGE_SEED_COUNT : Number(rawCount);

  if (
    !Number.isInteger(count) ||
    count < 1 ||
    count > MAX_LARGE_SEED_COUNT
  ) {
    return res.status(400).json({
      success: false,
      message: `count must be an integer between 1 and ${MAX_LARGE_SEED_COUNT}`
    });
  }

  try {
    const result = await seedLargeLeaderboardToRedis(count);

    return res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Failed to seed large Redis leaderboard:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to seed large leaderboard"
    });
  }
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

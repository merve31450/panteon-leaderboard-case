import { Router } from "express";
import {
  getPlayerLeaderboardContextController,
  getPlayerLeaderboardContextFromRedisController,
  getTopLeaderboardController,
  getTopLeaderboardFromRedisController,
  seedLeaderboardController
} from "./leaderboard.controller";

export const leaderboardRouter = Router();

leaderboardRouter.get("/top", getTopLeaderboardController);
leaderboardRouter.get("/player/:playerId", getPlayerLeaderboardContextController);

leaderboardRouter.post("/seed", seedLeaderboardController);
leaderboardRouter.get("/redis/top", getTopLeaderboardFromRedisController);
leaderboardRouter.get(
  "/redis/player/:playerId",
  getPlayerLeaderboardContextFromRedisController
);
import { Router } from "express";
import {
  getPlayerLeaderboardContextController,
  getPlayerLeaderboardContextFromRedisController,
  getTopLeaderboardController,
  getTopLeaderboardFromRedisController,
  seedLargeLeaderboardController,
  seedLeaderboardController
} from "./leaderboard.controller";
import { adminAuth } from "../../middlewares/adminAuth";

export const leaderboardRouter = Router();

leaderboardRouter.get("/top", getTopLeaderboardController);
leaderboardRouter.get("/player/:playerId", getPlayerLeaderboardContextController);

leaderboardRouter.post("/seed", adminAuth, seedLeaderboardController);
leaderboardRouter.post(
  "/seed-large",
  adminAuth,
  seedLargeLeaderboardController
);
leaderboardRouter.get("/redis/top", getTopLeaderboardFromRedisController);
leaderboardRouter.get(
  "/redis/player/:playerId",
  getPlayerLeaderboardContextFromRedisController
);

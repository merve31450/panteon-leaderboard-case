import { Request, Response } from "express";
import { isMongoConfigured } from "../../db/mongo";
import { isPostgresConfigured } from "../../db/postgres";

export function getSystemStackController(_req: Request, res: Response) {
  return res.json({
    success: true,
    data: {
      node: true,
      redis: true,
      postgresConfigured: isPostgresConfigured(),
      mongoConfigured: isMongoConfigured(),
      leaderboardEngine: "redis-sorted-set"
    }
  });
}

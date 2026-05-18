import { Request, Response } from "express";
import { env } from "../../config/env";
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
      adminGuardEnabled: Boolean(env.adminApiKey?.trim()),
      leaderboardEngine: "redis-sorted-set"
    }
  });
}

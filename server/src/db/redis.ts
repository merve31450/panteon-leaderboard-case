import Redis from "ioredis";
import { env } from "../config/env";

export const redis = new Redis(env.redisUrl);

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("error", (error) => {
  console.error("Redis connection error:", error);
});
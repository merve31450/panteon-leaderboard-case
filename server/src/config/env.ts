import dotenv from "dotenv";
import path from "path";

const envPaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "server/.env"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../.env")
];

for (const envPath of envPaths) {
  dotenv.config({ path: envPath, override: false });
}

export const env = {
  port: Number(process.env.PORT || 4000),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  adminApiKey: process.env.ADMIN_API_KEY,
  databaseUrl: process.env.DATABASE_URL,
  mongodbUri: process.env.MONGODB_URI,
  mongodbDbName: process.env.MONGODB_DB_NAME || "panteon_leaderboard"
};

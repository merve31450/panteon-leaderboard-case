import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { playersRouter } from "./modules/players/players.routes";
import { leaderboardRouter } from "./modules/leaderboard/leaderboard.routes";
import { rewardsRouter } from "./modules/rewards/rewards.routes";
import { earningsRouter } from "./modules/earnings/earnings.routes";
import { systemRouter } from "./modules/system/system.routes";
export const app = express();

app.use(cors({
  origin: env.clientUrl,
  credentials: true
}));

app.use(express.json());

app.use("/api/players", playersRouter);
app.use("/api/leaderboard", leaderboardRouter);
app.use("/api/rewards", rewardsRouter);
app.use("/api/earnings", earningsRouter);
app.use("/api/system", systemRouter);
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "Panteon leaderboard backend is running"
  });
});

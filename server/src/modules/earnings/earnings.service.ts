import { redis } from "../../db/redis";

const WEEKLY_LEADERBOARD_KEY = "weekly:leaderboard";

export type EarningResult = {
  playerId: string;
  earningAmount: number;
  prizePoolContribution: number;
  netAmount: number;
  updatedScore: number;
};

export async function createEarning(
  playerId: string,
  amount: number
): Promise<EarningResult> {
  const prizePoolContribution = Number((amount * 0.02).toFixed(2));
  const netAmount = Number((amount - prizePoolContribution).toFixed(2));
  const updatedScore = Number(
    await redis.zincrby(WEEKLY_LEADERBOARD_KEY, amount, playerId)
  );

  return {
    playerId,
    earningAmount: amount,
    prizePoolContribution,
    netAmount,
    updatedScore
  };
}

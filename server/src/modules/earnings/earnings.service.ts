import { redis } from "../../db/redis";
import {
  WEEKLY_LEADERBOARD_KEY,
  WEEKLY_PRIZE_POOL_KEY
} from "../leaderboard/leaderboard.service";
import {
  recordEarningLedger,
  recordGameEvent
} from "../persistence/persistence.service";

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
  const pipeline = redis.pipeline();

  pipeline.zincrby(WEEKLY_LEADERBOARD_KEY, amount, playerId);
  pipeline.incrbyfloat(WEEKLY_PRIZE_POOL_KEY, prizePoolContribution);

  const results = await pipeline.exec();

  if (!results) {
    throw new Error("Redis pipeline did not return earning results");
  }

  const failedCommand = results.find(([error]) => error !== null);

  if (failedCommand) {
    throw failedCommand[0];
  }

  const updatedScore = Number(results[0][1]);

  const earning = {
    playerId,
    earningAmount: amount,
    prizePoolContribution,
    netAmount,
    updatedScore
  };

  await recordEarningLedger({
    ...earning,
    occurredAt: new Date().toISOString()
  });

  await recordGameEvent({
    type: "earning_recorded",
    playerId,
    amount,
    prizePoolContribution,
    netAmount,
    updatedScore
  });

  return earning;
}

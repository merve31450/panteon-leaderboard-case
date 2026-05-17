import { redis } from "../../db/redis";
import {
  getTopLeaderboardFromRedis,
  WEEKLY_LEADERBOARD_KEY,
  WEEKLY_PRIZE_POOL_KEY
} from "../leaderboard/leaderboard.service";

type RewardPreviewItem = {
  rank: number;
  playerId: string;
  username: string;
  score: number;
  rewardAmount: number;
  rewardPercentage: number;
};

const WEEKLY_REWARD_DISTRIBUTION_LOCK_KEY =
  "weekly:rewards:distribution-lock";

export async function getWeeklyRewardPreview() {
  const leaderboard = await getTopLeaderboardFromRedis(100);

  // In this demo, the weekly Redis score is treated as the weekly earning.
  // In production, this total should come from PostgreSQL earning transactions.
  const totalWeeklyEarning = leaderboard.reduce(
    (sum, player) => sum + player.score,
    0
  );

  const prizePool = totalWeeklyEarning * 0.02;

  const rewards: RewardPreviewItem[] = [];

  for (const player of leaderboard) {
    let rewardPercentage = 0;

    if (player.rank === 1) {
      rewardPercentage = 20;
    } else if (player.rank === 2) {
      rewardPercentage = 15;
    } else if (player.rank === 3) {
      rewardPercentage = 10;
    }

    rewards.push({
      rank: player.rank,
      playerId: player.playerId,
      username: player.username,
      score: player.score,
      rewardPercentage,
      rewardAmount: Number(((prizePool * rewardPercentage) / 100).toFixed(2))
    });
  }

  const remainingPool = prizePool * 0.55;

  const rankBasedPlayers = leaderboard.filter(
    (player) => player.rank >= 4 && player.rank <= 100
  );

  const totalWeight = rankBasedPlayers.reduce((sum, player) => {
    const weight = 101 - player.rank;
    return sum + weight;
  }, 0);

  if (totalWeight > 0 && prizePool > 0) {
    for (const player of rankBasedPlayers) {
      const weight = 101 - player.rank;
      const rewardAmount = (remainingPool * weight) / totalWeight;
      const rewardPercentage = (rewardAmount / prizePool) * 100;

      const rewardIndex = rewards.findIndex(
        (reward) => reward.playerId === player.playerId
      );

      if (rewardIndex !== -1) {
        rewards[rewardIndex] = {
          ...rewards[rewardIndex],
          rewardPercentage: Number(rewardPercentage.toFixed(2)),
          rewardAmount: Number(rewardAmount.toFixed(2))
        };
      }
    }
  }

  return {
    weekId: "2026-W20",
    totalWeeklyEarning,
    prizePool: Number(prizePool.toFixed(2)),
    distribution: {
      firstPlace: "20%",
      secondPlace: "15%",
      thirdPlace: "10%",
      rank4To100: "55% rank-based"
    },
    rewards
  };
}

export async function distributeWeeklyRewards() {
  const lockToken = `${Date.now()}-${Math.random()}`;
  const lockAcquired = await redis.set(
    WEEKLY_REWARD_DISTRIBUTION_LOCK_KEY,
    lockToken,
    "EX",
    60,
    "NX"
  );

  if (lockAcquired !== "OK") {
    throw new Error("Weekly reward distribution is already in progress");
  }

  try {
    const distribution = await getWeeklyRewardPreview();
    const pipeline = redis.pipeline();

    pipeline.del(WEEKLY_LEADERBOARD_KEY);
    pipeline.del(WEEKLY_PRIZE_POOL_KEY);

    const results = await pipeline.exec();

    if (!results) {
      throw new Error("Redis pipeline did not return reset results");
    }

    const failedCommand = results.find(([error]) => error !== null);

    if (failedCommand) {
      throw failedCommand[0];
    }

    return {
      ...distribution,
      distributedAt: new Date().toISOString(),
      reset: {
        weeklyLeaderboard: true,
        prizePool: true
      }
    };
  } finally {
    const currentToken = await redis.get(WEEKLY_REWARD_DISTRIBUTION_LOCK_KEY);

    if (currentToken === lockToken) {
      await redis.del(WEEKLY_REWARD_DISTRIBUTION_LOCK_KEY);
    }
  }
}

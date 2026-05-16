import { getTopLeaderboardFromRedis } from "../leaderboard/leaderboard.service";

type RewardPreviewItem = {
  rank: number;
  playerId: string;
  username: string;
  score: number;
  rewardAmount: number;
  rewardPercentage: number;
};

export async function getWeeklyRewardPreview() {
  const leaderboard = await getTopLeaderboardFromRedis(100);

  // Mock aşamasında score değerini haftalık kazanç gibi kabul ediyoruz.
  // Gerçek sistemde bu bilgi earning transaction kayıtlarından gelecek.
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

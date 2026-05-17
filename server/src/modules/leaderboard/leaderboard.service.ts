import { redis } from "../../db/redis";
export type LeaderboardPlayer = {
  rank: number;
  playerId: string;
  username: string;
  country: string;
  score: number;
};
export const WEEKLY_LEADERBOARD_KEY = "weekly:leaderboard";
export const WEEKLY_PRIZE_POOL_KEY = "weekly:prize-pool";
const leaderboard: LeaderboardPlayer[] = [
  {
    rank: 1,
    playerId: "player-1",
    username: "DragonSlayer",
    country: "TR",
    score: 9800
  },
  {
    rank: 2,
    playerId: "player-2",
    username: "ShadowHunter",
    country: "US",
    score: 9200
  },
  {
    rank: 3,
    playerId: "player-3",
    username: "PixelQueen",
    country: "DE",
    score: 8700
  },
  {
    rank: 4,
    playerId: "player-4",
    username: "CodeWizard",
    country: "GB",
    score: 8100
  },
  {
    rank: 5,
    playerId: "player-5",
    username: "NightWolf",
    country: "FR",
    score: 7600
  },
  {
    rank: 6,
    playerId: "player-6",
    username: "StormBreaker",
    country: "ES",
    score: 7100
  },
  {
    rank: 7,
    playerId: "player-7",
    username: "BladeRunner",
    country: "IT",
    score: 6600
  },
  {
    rank: 8,
    playerId: "player-8",
    username: "FrostByte",
    country: "NL",
    score: 6100
  },
  {
    rank: 9,
    playerId: "player-9",
    username: "StarForge",
    country: "BR",
    score: 5600
  },
  {
    rank: 10,
    playerId: "player-10",
    username: "MoonRider",
    country: "JP",
    score: 5100
  }
];

export function getTopLeaderboard(limit = 100) {
  return leaderboard
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((player, index) => ({
      ...player,
      rank: index + 1
    }));
}

export function getPlayerLeaderboardContext(playerId: string) {
  const sortedLeaderboard = getTopLeaderboard(leaderboard.length);

  const playerIndex = sortedLeaderboard.findIndex(
    (player) => player.playerId === playerId
  );

  if (playerIndex === -1) {
    return null;
  }

  const player = sortedLeaderboard[playerIndex];

  const startIndex = Math.max(playerIndex - 3, 0);
  const endIndex = Math.min(playerIndex + 3, sortedLeaderboard.length);

  const nearbyPlayers = sortedLeaderboard.slice(startIndex, endIndex);

  return {
    player,
    nearbyPlayers
  };
}
export async function seedLeaderboardToRedis() {
  const pipeline = redis.pipeline();

  pipeline.del(WEEKLY_LEADERBOARD_KEY);

  for (const player of leaderboard) {
    pipeline.zadd(
      WEEKLY_LEADERBOARD_KEY,
      player.score,
      player.playerId
    );
  }

  const results = await pipeline.exec();

  if (!results) {
    throw new Error("Redis pipeline did not return seed results");
  }

  const failedCommand = results.find(([error]) => error !== null);

  if (failedCommand) {
    throw failedCommand[0];
  }

  return {
    message: "Leaderboard seeded to Redis",
    totalPlayers: leaderboard.length
  };
}
function getPlayerMetadata(playerId: string) {
  return leaderboard.find((player) => player.playerId === playerId);
}

export async function getTopLeaderboardFromRedis(limit = 100) {
  const redisResult = await redis.zrevrange(
    WEEKLY_LEADERBOARD_KEY,
    0,
    limit - 1,
    "WITHSCORES"
  );

  const result: LeaderboardPlayer[] = [];

  for (let i = 0; i < redisResult.length; i += 2) {
    const playerId = redisResult[i];
    const score = Number(redisResult[i + 1]);
    const metadata = getPlayerMetadata(playerId);

    result.push({
      rank: result.length + 1,
      playerId,
      username: metadata?.username || "Unknown",
      country: metadata?.country || "N/A",
      score
    });
  }

  return result;
}
export async function getPlayerLeaderboardContextFromRedis(playerId: string) {
  const rank = await redis.zrevrank(WEEKLY_LEADERBOARD_KEY, playerId);

  if (rank === null) {
    return null;
  }

  const startIndex = Math.max(rank - 3, 0);
  const endIndex = rank + 2;

  const redisResult = await redis.zrevrange(
    WEEKLY_LEADERBOARD_KEY,
    startIndex,
    endIndex,
    "WITHSCORES"
  );

  const nearbyPlayers: LeaderboardPlayer[] = [];

  for (let i = 0; i < redisResult.length; i += 2) {
    const currentPlayerId = redisResult[i];
    const score = Number(redisResult[i + 1]);
    const metadata = getPlayerMetadata(currentPlayerId);

    nearbyPlayers.push({
      rank: startIndex + nearbyPlayers.length + 1,
      playerId: currentPlayerId,
      username: metadata?.username || "Unknown",
      country: metadata?.country || "N/A",
      score
    });
  }

  const player = nearbyPlayers.find(
    (item) => item.playerId === playerId
  );

  return {
    player,
    nearbyPlayers
  };
}

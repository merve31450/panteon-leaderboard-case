import { getMongoDb, isMongoConfigured } from "../../db/mongo";
import { isPostgresConfigured, queryPostgres } from "../../db/postgres";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type JsonObject = { [key: string]: JsonValue };

export type EarningLedgerEntry = {
  playerId: string;
  earningAmount: number;
  prizePoolContribution: number;
  netAmount: number;
  updatedScore: number;
  occurredAt: string;
};

export type RewardDistributionItemRecord = {
  rank: number;
  playerId: string;
  username: string;
  score: number;
  rewardAmount: number;
  rewardPercentage: number;
};

export type RewardDistributionRecord = {
  weekId: string;
  totalWeeklyEarning: number;
  prizePool: number;
  distribution: JsonObject;
  rewards: RewardDistributionItemRecord[];
  distributedAt: string;
  reset?: JsonObject;
};

export type WeeklySettlementRecord = {
  weekId: string;
  status: string;
  totalWeeklyEarning: number;
  prizePool: number;
  rewardCount: number;
  settledAt: string;
  reset: JsonObject;
};

export type GameEventRecord = JsonObject;

let loggedPostgresSkip = false;
let loggedMongoSkip = false;

function logPostgresSkip() {
  if (!loggedPostgresSkip) {
    console.log("PostgreSQL persistence skipped: DATABASE_URL is not configured");
    loggedPostgresSkip = true;
  }
}

function logMongoSkip() {
  if (!loggedMongoSkip) {
    console.log("MongoDB event logging skipped: MONGODB_URI is not configured");
    loggedMongoSkip = true;
  }
}

export async function recordEarningLedger(entry: EarningLedgerEntry) {
  if (!isPostgresConfigured()) {
    logPostgresSkip();
    return;
  }

  try {
    const result = await queryPostgres(
      `INSERT INTO earning_ledger
        (player_id, amount, prize_pool_contribution, net_amount, updated_score, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        entry.playerId,
        entry.earningAmount,
        entry.prizePoolContribution,
        entry.netAmount,
        entry.updatedScore,
        entry.occurredAt
      ]
    );

    if (result?.rowCount) {
      console.log("PostgreSQL earning ledger recorded");
    } else {
      console.error("PostgreSQL earning ledger skipped after failure");
    }
  } catch (error) {
    console.error(
      "PostgreSQL earning ledger skipped after failure:",
      error instanceof Error ? error.message : error
    );
  }
}

export async function recordRewardDistribution(
  distribution: RewardDistributionRecord
) {
  if (!isPostgresConfigured()) {
    logPostgresSkip();
    return;
  }

  if (distribution.rewards.length === 0) {
    console.log("PostgreSQL reward distributions recorded: 0");
    return;
  }

  try {
    let recordedCount = 0;

    for (const reward of distribution.rewards) {
      const payload = {
        weekId: distribution.weekId,
        totalWeeklyEarning: distribution.totalWeeklyEarning,
        prizePool: distribution.prizePool,
        distribution: distribution.distribution,
        distributedAt: distribution.distributedAt,
        reset: distribution.reset,
        reward
      };

      const result = await queryPostgres(
        `INSERT INTO reward_distributions
          (
            week_id,
            player_id,
            username,
            rank,
            score,
            reward_amount,
            reward_percentage,
            total_weekly_earning,
            prize_pool,
            payload,
            distributed_at
          )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11)`,
        [
          distribution.weekId,
          reward.playerId,
          reward.username,
          reward.rank,
          reward.score,
          reward.rewardAmount,
          reward.rewardPercentage,
          distribution.totalWeeklyEarning,
          distribution.prizePool,
          JSON.stringify(payload),
          distribution.distributedAt
        ]
      );

      if (result?.rowCount) {
        recordedCount += result.rowCount;
      } else {
        console.error(
          `PostgreSQL reward distribution row skipped after failure: ${reward.playerId}`
        );
      }
    }

    console.log(
      `PostgreSQL reward distributions recorded (${recordedCount} rows)`
    );
  } catch (error) {
    console.error(
      "PostgreSQL reward distributions skipped after failure:",
      error instanceof Error ? error.message : error
    );
  }
}

export async function recordWeeklySettlement(settlement: WeeklySettlementRecord) {
  if (!isPostgresConfigured()) {
    logPostgresSkip();
    return;
  }

  try {
    const result = await queryPostgres(
      `INSERT INTO weekly_settlements
        (
          week_id,
          status,
          total_weekly_earning,
          prize_pool,
          reward_count,
          payload,
          settled_at
        )
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
       ON CONFLICT (week_id) DO UPDATE SET
         status = EXCLUDED.status,
         total_weekly_earning = EXCLUDED.total_weekly_earning,
         prize_pool = EXCLUDED.prize_pool,
         reward_count = EXCLUDED.reward_count,
         payload = EXCLUDED.payload,
         settled_at = EXCLUDED.settled_at`,
      [
        settlement.weekId,
        settlement.status,
        settlement.totalWeeklyEarning,
        settlement.prizePool,
        settlement.rewardCount,
        JSON.stringify(settlement),
        settlement.settledAt
      ]
    );

    if (result?.rowCount) {
      console.log("PostgreSQL weekly settlement recorded");
    } else {
      console.error("PostgreSQL weekly settlement skipped after failure");
    }
  } catch (error) {
    console.error(
      "PostgreSQL weekly settlement skipped after failure:",
      error instanceof Error ? error.message : error
    );
  }
}

export async function recordGameEvent(event: GameEventRecord) {
  if (!isMongoConfigured()) {
    logMongoSkip();
    return;
  }

  const db = await getMongoDb();

  if (!db) {
    return;
  }

  try {
    await db.collection("game_events").insertOne({
      ...event,
      createdAt: new Date()
    });
  } catch (error) {
    console.error(
      "MongoDB game event skipped after failure:",
      error instanceof Error ? error.message : error
    );
  }
}

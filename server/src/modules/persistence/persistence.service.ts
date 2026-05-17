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

export type RewardDistributionRecord = JsonObject;
export type WeeklySettlementRecord = JsonObject;
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

  await queryPostgres(
    `INSERT INTO earning_transactions
      (player_id, amount, prize_pool_contribution, net_amount, updated_score, occurred_at)
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
}

export async function recordRewardDistribution(
  distribution: RewardDistributionRecord
) {
  if (!isPostgresConfigured()) {
    logPostgresSkip();
    return;
  }

  await queryPostgres(
    `INSERT INTO reward_distributions
      (week_id, total_weekly_earning, prize_pool, payload, distributed_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      distribution.weekId,
      distribution.totalWeeklyEarning,
      distribution.prizePool,
      JSON.stringify(distribution),
      distribution.distributedAt
    ]
  );
}

export async function recordWeeklySettlement(settlement: WeeklySettlementRecord) {
  if (!isPostgresConfigured()) {
    logPostgresSkip();
    return;
  }

  await queryPostgres(
    `INSERT INTO weekly_settlements
      (week_id, status, payload, settled_at)
     VALUES ($1, $2, $3, $4)`,
    [
      settlement.weekId,
      settlement.status,
      JSON.stringify(settlement),
      settlement.settledAt
    ]
  );
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

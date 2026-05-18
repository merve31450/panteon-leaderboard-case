# Architecture

## Overview

The Panteon Leaderboard Case is a full-stack prototype for a large-scale game leaderboard. The demo has 10 seeded players only so the app is easy to run locally, but the target production scenario is 10M+ registered players and around 2M daily active users.

The production design separates hot leaderboard ranking from durable storage:

```text
React Client
  -> Load Balancer / API Gateway
  -> Stateless Node.js + Express API instances
  -> Redis Sorted Sets for live leaderboard ranking
  -> PostgreSQL for players, earning ledger, reward transactions, weekly settlements
  -> MongoDB for game events, player activity logs, analytics, telemetry
```

Local and production service flow:

```text
React Client -> Node.js API -> Redis
                           -> PostgreSQL
                           -> MongoDB
```

Redis remains the ranking engine even when PostgreSQL and MongoDB are configured. The databases add durability and analytics support, while Redis keeps rank updates and reads fast enough for the live leaderboard path.

## Frontend Architecture

The React client is a thin dashboard over the stateless API. It calls the leaderboard, selected-player context, reward preview, and earning endpoints directly, then keeps only temporary view state such as filters, the selected player, form values, and the latest API responses in React state. It does not store leaderboard state permanently.

The dashboard is organized around reusable React components:

- `StatCard` for summary metrics.
- `LeaderboardTable` for the searchable and filterable leaderboard view.
- `NearbyPlayers` for the selected player's rank context.
- `RewardPreview` for weekly reward distribution preview data.
- `EarningForm` for earning simulation submissions.

This keeps the frontend focused on discoverability and presentation while Redis, PostgreSQL, MongoDB, and the stateless Node.js API remain responsible for shared system state.

## Stateless Backend

The backend should be stateless. No API instance should depend on in-process leaderboard, session, or payout state. Any instance behind the load balancer can handle any request because shared state lives in Redis, PostgreSQL, MongoDB, or an external auth/session service.

This makes horizontal scaling straightforward:

- Add more backend instances during traffic peaks.
- Use Redis for live ranking reads and writes.
- Use PostgreSQL for durable financial records through optional production persistence adapters.
- Use MongoDB for high-volume activity and analytics documents through optional event adapters.
- Use distributed locks, queues, or scheduled workers for weekly reward distribution.

## Redis Sorted Set Design

Redis Sorted Sets are the core scalable leaderboard structure. Each player is stored as a member and the weekly earning score is stored as the sorted-set score.

Demo key:

```text
weekly:leaderboard
```

Production key pattern:

```text
leaderboard:weekly:<weekId>
```

Examples:

```text
leaderboard:weekly:2026-W20
leaderboard:weekly:2026-W20:final
leaderboard:weekly:current
```

Redis is suitable for large-scale leaderboard ranking because it keeps members ordered by score and supports rank and range reads without sorting relational rows on each request. It is especially effective for hot data such as the active weekly leaderboard.

## Redis Operations

Score update after an earning:

```text
ZINCRBY weekly:leaderboard <amount> <playerId>
```

Top players:

```text
ZREVRANGE weekly:leaderboard 0 99 WITHSCORES
```

Player rank:

```text
ZREVRANK weekly:leaderboard <playerId>
```

Nearby players around a rank:

```text
ZREVRANGE weekly:leaderboard <startIndex> <endIndex> WITHSCORES
```

The API uses descending rank order because higher weekly earning scores should rank higher.

## Top 100 Behavior

The top leaderboard endpoint reads the first 100 players from Redis using `ZREVRANGE`. For production, this gives a fast global or segmented leaderboard view without scanning all registered players.

If the active leaderboard has fewer than 100 players, Redis returns only the available players. The current demo therefore returns the 10 seeded players after seeding.

## Selected Player Context

The selected player flow uses `ZREVRANK` to find the player's zero-based Redis rank. Then it reads a small range around that rank.

The intended behavior is:

- selected player
- 3 players above
- 2 players below

At the top or bottom of the leaderboard, the range is clamped so the API returns the available nearby players without invalid indexes.

## Weekly Prize Pool

Each earning contributes 2% to the weekly prize pool:

```text
prizePoolContribution = earningAmount * 0.02
netAmount = earningAmount - prizePoolContribution
```

Reward distribution:

- 1st place gets 20% of the prize pool.
- 2nd place gets 15%.
- 3rd place gets 10%.
- Ranks 4-100 share the remaining 55% based on rank weight.

For ranks 4-100, the demo uses stronger weight for higher ranks:

```text
weight = 101 - rank
playerReward = remainingPool * playerWeight / totalWeight
```

In this demo, Redis leaderboard score is treated as weekly earning so reviewers can test the flow without a full earning ledger. In production, prize-pool totals should be calculated from PostgreSQL earning transactions.

## Weekly Distribution And Reset

The weekly distribution/reset operation should:

1. Acquire a distributed lock for the week.
2. Read the final top 100 from Redis.
3. Calculate `totalWeeklyEarning`, `prizePool`, distribution percentages, and player rewards.
4. Persist the reward run and reward transactions in PostgreSQL.
5. Reset or rotate the Redis weekly leaderboard key.
6. Reset the weekly prize pool accumulator.
7. Initialize the next week's leaderboard.

The demo endpoint `POST /api/rewards/distribute-weekly` performs the Redis-backed calculation, returns the distributed rewards, and resets `weekly:leaderboard` plus `weekly:prize-pool`. Production should persist reward transactions in PostgreSQL before resetting Redis so payouts are auditable and retryable.

## PostgreSQL Role

PostgreSQL should be the durable system of record for financial and settlement data:

- `players`: canonical player identity, account status, country, display name references
- `earning_ledger`: immutable earning ledger rows
- `reward_transactions`: one row per calculated player reward
- `weekly_settlements`: weekly run status, totals, timestamps, operator/job metadata
- idempotency keys for earning submission and reward payout requests

PostgreSQL is the right place for data that needs transactions, constraints, audit history, reconciliation, and reliable settlement status.

In this demo, PostgreSQL is optional. If `DATABASE_URL` is missing, the application keeps running and persistence methods no-op safely. If it is configured, the persistence layer attempts to record earning ledger rows, reward distribution payloads, and weekly settlement payloads. A failed PostgreSQL write is logged but does not break the Redis leaderboard API response.

## MongoDB Role

MongoDB should support flexible, high-volume product and analytics data:

- game events
- player activity logs
- match/session telemetry
- analytics events
- support/debugging event documents
- denormalized player activity snapshots

MongoDB should not replace PostgreSQL for financial truth. It complements the relational store by handling flexible event documents and analytics-oriented records.

In this demo, MongoDB is optional. If `MONGODB_URI` is missing, event logging is skipped safely. If it is configured, the persistence layer writes game and activity events to the `game_events` collection in `MONGODB_DB_NAME`, which defaults to `panteon_leaderboard`.

Local MongoDB collection and index guidance lives in `server/db/mongo-indexes.md`.

## Safe Optional Persistence

The server exposes optional persistence helpers:

- `isPostgresConfigured()`
- `queryPostgres(...)`
- `isMongoConfigured()`
- `getMongoDb()`

The production persistence service wraps those helpers with safe methods:

- `recordEarningLedger(entry)`
- `recordRewardDistribution(distribution)`
- `recordWeeklySettlement(settlement)`
- `recordGameEvent(event)`

These methods are best-effort in the demo. Missing URLs, unavailable databases, or missing production tables do not stop Redis leaderboard updates, reward previews, or weekly distribution responses. In production, the same adapters should be paired with migrations, table constraints, idempotency keys, retries, and monitoring.

The local PostgreSQL schema is defined in `server/db/schema.sql`. It includes `players`, `earning_ledger`, `reward_distributions`, and `weekly_settlements` with indexes for `player_id`, `week_id`, and `created_at`.

## Scaling Notes For 10M+ Players And 2M DAU

At this scale, the system should keep hot paths small and predictable:

- Use Redis Sorted Sets for active weekly ranking.
- Use `ZINCRBY` for score updates instead of recalculating ranks.
- Use `ZREVRANGE` for top 100 and nearby-player reads.
- Keep the 10 seeded players strictly as demo data; production player volume belongs in PostgreSQL and derived caches/read models.
- Keep leaderboard keys segmented by week, region, game mode, or shard if needed.
- Write immutable earning rows to PostgreSQL with idempotency keys.
- Use queues for side effects such as analytics, notifications, and activity logs.
- Cache player display metadata or use denormalized MongoDB read models.
- Add PostgreSQL connection pooling and partition large tables by `week_id` or time.
- Monitor Redis memory, latency, persistence, replication, and failover.
- Add rate limiting and abuse detection to earning submission endpoints.
- Run weekly distribution as a controlled worker or cron job with locking and retries.

The current API also exposes `GET /api/system/stack` so operators can verify whether PostgreSQL and MongoDB persistence adapters are configured without exposing secret connection strings.

Redis can handle very large sorted sets when memory and key design are planned carefully. For a 2M DAU game, the active weekly board should be sized, monitored, and possibly split by region or mode depending on traffic and product requirements.

## Deployment

Recommended managed deployment for this case:

- Frontend: Vercel
- Backend API: Render
- Redis: Upstash Redis
- PostgreSQL: Neon, Supabase, Render PostgreSQL, AWS RDS, or similar
- MongoDB: MongoDB Atlas

The backend should stay stateless on Render. Vercel should point the React client at the Render API URL. Upstash Redis should be configured through `REDIS_URL`, with no secrets committed to the repository.

Optional production environment variables:

```text
DATABASE_URL=
MONGODB_URI=
MONGODB_DB_NAME=panteon_leaderboard
```

## Current Prototype Limits

- The repository contains only 10 demo players.
- PostgreSQL and MongoDB are optional production persistence adapters; local development works without their URLs.
- Redis stores live leaderboard score and a demo prize-pool accumulator.
- The weekly distribution endpoint resets Redis state but does not execute real payments.
- Authentication, authorization, rate limiting, queue workers, and observability are not implemented in the demo.

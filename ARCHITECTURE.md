# Architecture

## Overview

The Panteon Leaderboard Case is a full-stack prototype for a weekly, earnings-based leaderboard. The current implementation uses a React frontend, a TypeScript Express backend, and Redis Sorted Sets for real-time ranking behavior.

In a production system, the backend should remain stateless, Redis should serve the hot leaderboard path, PostgreSQL should own durable financial records, and MongoDB can support flexible activity and read-model workloads.

## Production Architecture

```text
Frontend
  -> API Gateway / Load Balancer
  -> Stateless Backend Instances
  -> Redis Sorted Sets for live leaderboard ranking
  -> PostgreSQL for durable earnings and reward payout history
  -> MongoDB for activity logs, snapshots, and denormalized read models
```

The backend instances should not store leaderboard, session, or reward state in process memory. Any instance should be able to handle any request, which allows horizontal scaling behind a load balancer.

## Stateless Backend Design

The backend should expose HTTP APIs for players, earnings, leaderboard reads, and reward operations. Each request should be handled independently:

- Authentication context should come from signed tokens or an external session store.
- Leaderboard scores should be read from Redis.
- Durable earning and payout records should be written to PostgreSQL.
- Activity history and denormalized query models can be written to MongoDB.
- Scheduled jobs should use distributed locks or queue-based coordination to avoid duplicate weekly resets and payouts.

This keeps backend nodes replaceable and scalable. More instances can be added without data migration or sticky sessions.

## Redis Sorted Sets for Real-Time Ranking

Redis Sorted Sets are a strong fit for real-time leaderboard ranking because they store members with numeric scores and keep them ordered efficiently.

For this case:

- Member: `playerId`
- Score: weekly earning score
- Key: `weekly:leaderboard`

Important operations:

- `ZINCRBY weekly:leaderboard <amount> <playerId>` increments a player's weekly score after an earning.
- `ZREVRANGE weekly:leaderboard 0 99 WITHSCORES` returns the top 100 players.
- `ZREVRANK weekly:leaderboard <playerId>` returns a player's current rank.
- `ZREVRANGE weekly:leaderboard <start> <end> WITHSCORES` returns nearby players around a rank.

These operations are fast enough for high-read leaderboard workloads and avoid recalculating ranks from relational tables on every request.

## PostgreSQL Durable Records

PostgreSQL should be the system of record for financial and reward data. Redis leaderboard state is optimized for speed, not long-term durability or auditability.

Recommended PostgreSQL tables include:

- `earning_transactions`: one immutable row per player earning event.
- `weekly_reward_runs`: one row per weekly reward calculation and distribution run.
- `reward_payouts`: one row per player reward payout.
- `players`: canonical player identity and account metadata, if not owned by another service.

`earning_transactions` should store fields such as:

- `id`
- `player_id`
- `amount`
- `prize_pool_contribution`
- `net_amount`
- `week_id`
- `idempotency_key`
- `created_at`

`reward_payouts` should store fields such as:

- `id`
- `week_id`
- `player_id`
- `rank`
- `score`
- `reward_amount`
- `reward_percentage`
- `status`
- `paid_at`
- `created_at`

Earning writes should be idempotent. If clients retry a request, the same earning should not be counted twice.

## MongoDB Flexible Read and Activity Storage

MongoDB can complement PostgreSQL by storing flexible, high-volume, or denormalized documents that are useful for product and analytics workflows.

Good MongoDB use cases include:

- Player activity logs, such as login, match, purchase, and earning-related events.
- Player profile snapshots captured at specific times.
- Denormalized leaderboard read models enriched with username, avatar, country, level, or segment data.
- Audit-friendly event documents that are useful for debugging and support tools.

MongoDB should not replace PostgreSQL for financial transaction truth. It is best used for flexible event history and read-optimized documents.

## Redis Weekly Leaderboard Model

The hot leaderboard key can remain:

```text
weekly:leaderboard
```

For production, include a week identifier in the key:

```text
leaderboard:weekly:<weekId>
```

Example:

```text
leaderboard:weekly:2026-W20
```

This allows the system to keep current and previous leaderboards separately. Redis can also keep helper keys such as:

- `leaderboard:weekly:<weekId>` for active scores.
- `leaderboard:weekly:<weekId>:final` for a frozen final ranking.
- `leaderboard:weekly:current` for the active week identifier.

Top 100 query:

```text
ZREVRANGE leaderboard:weekly:<weekId> 0 99 WITHSCORES
```

Nearby player query:

```text
ZREVRANK leaderboard:weekly:<weekId> <playerId>
ZREVRANGE leaderboard:weekly:<weekId> <rank-3> <rank+3> WITHSCORES
```

Player display metadata should usually come from PostgreSQL, MongoDB read models, or a cache, not from the Redis sorted set itself.

## Weekly Reset Flow

A production weekly reset should be handled by a scheduled job or worker:

1. Acquire a distributed lock for the target `weekId`.
2. Stop accepting writes to the closing leaderboard key or route late writes to the correct week by timestamp.
3. Read the final top 100 from Redis.
4. Persist the final leaderboard snapshot and reward run metadata.
5. Calculate rewards from durable earning data in PostgreSQL.
6. Create `reward_payouts` rows in PostgreSQL with pending status.
7. Initialize the next week's Redis leaderboard key.
8. Update `leaderboard:weekly:current`.
9. Expire or archive old Redis keys after the required retention window.

The reset should be idempotent. Re-running the job for the same `weekId` should not duplicate payouts or mutate already finalized data.

## Reward Distribution Flow

Reward distribution should be separated from leaderboard reads:

1. Calculate the weekly prize pool from PostgreSQL earning transactions.
2. Load the finalized top 100 ranking from Redis or a persisted leaderboard snapshot.
3. Apply the reward rule:
   - Rank 1 receives 20%.
   - Rank 2 receives 15%.
   - Rank 3 receives 10%.
   - Ranks 4-100 share the remaining 55% by rank-based weight.
4. Persist a `weekly_reward_runs` record.
5. Persist one `reward_payouts` record per rewarded player.
6. Send payouts through a payment, wallet, or balance service.
7. Mark each payout as paid, failed, or retriable.

The API can expose reward previews, but actual payout execution should run through a controlled backend worker with idempotency and audit logs.

## Scalability Notes

The target scale of 10M registered users and 2M daily active users requires separating hot-path ranking from durable storage.

Key considerations:

- Keep leaderboard updates lightweight: write the earning transaction to PostgreSQL and increment Redis with `ZINCRBY`.
- Use queues for non-critical side effects such as activity logging, profile snapshot updates, notifications, and analytics events.
- Use read replicas or denormalized MongoDB read models for player profile enrichment.
- Cache frequently requested player metadata.
- Use connection pooling for PostgreSQL and Redis.
- Partition large PostgreSQL tables by `week_id` or time where appropriate.
- Use idempotency keys for earning submission and reward payout requests.
- Add rate limiting and abuse detection around earning submission endpoints.
- Use observability: structured logs, metrics, traces, and alerts for leaderboard lag, failed payouts, Redis latency, and database write errors.

Redis can handle large sorted sets, but memory sizing, persistence configuration, backup strategy, and high availability should be planned carefully. For very large regional or segmented leaderboards, use separate keys by week, region, game mode, or shard.

## Deployment Suggestion

A practical managed deployment for this case:

- Frontend: Vercel
- Backend: Render or Railway
- Redis: Upstash Redis
- PostgreSQL: managed PostgreSQL from Neon, Supabase, Render, Railway, AWS RDS, or similar
- MongoDB: MongoDB Atlas

The backend should be deployed as multiple stateless instances when traffic requires it. Scheduled weekly jobs can run as a separate worker process or managed cron job.

## Current Prototype Limitations

The current repository is intentionally scoped as a case prototype:

- Player and leaderboard data are mock datasets.
- Redis stores weekly scores, but durable PostgreSQL earning history is not implemented.
- Reward payout history is not persisted.
- MongoDB activity logs, player snapshots, and denormalized read models are not implemented.
- The reward preview currently derives weekly earnings from Redis scores.
- There is no authentication, authorization, idempotency, queue, or distributed lock.
- Weekly reset and actual payout execution are not implemented.
- The frontend is a dashboard for demonstration rather than a production player-facing product.

These limitations are acceptable for demonstrating the leaderboard mechanics, but production use would require durable transaction storage, payout auditing, operational safeguards, and stronger reliability guarantees.

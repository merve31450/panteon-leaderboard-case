# Panteon Leaderboard Case

A full-stack leaderboard system for the Panteon Full Stack Developer case. The demo uses a TypeScript Express API, Redis Sorted Sets for real-time weekly ranking, and a React + Vite client.

Live URLs:

- Frontend: https://panteon-leaderboard-case.vercel.app
- Backend API: https://panteon-leaderboard-case-3.onrender.com

Manual smoke testing steps are documented in [TESTING.md](./TESTING.md).

The 10 seeded players in this repository are tiny demo seed data only. They exist so the reviewer can run the app quickly. The intended production scenario is a game with 10M+ registered players and around 2M daily active users. For larger local Redis ranking checks, use the separate large seed endpoint instead of loading millions of players by default.

## Tech Stack

- Backend: Node.js, Express, TypeScript
- Frontend: React, TypeScript, Vite
- Real-time ranking: Redis Sorted Sets via ioredis
- Optional production relational adapter: PostgreSQL via `pg` for players, earning ledger, reward transactions, and weekly settlements
- Optional production document/event adapter: MongoDB via `mongodb` for game events, player activity logs, analytics, and telemetry
- Deployment: Render for API, Vercel for client, Upstash Redis for managed Redis

## What It Does

- Displays the weekly top leaderboard.
- Stores live leaderboard scores in Redis Sorted Sets.
- Updates player score with `ZINCRBY` when an earning is submitted.
- Calculates a 2% weekly prize pool from Redis leaderboard data in the demo.
- Previews weekly reward distribution without changing state.
- Distributes weekly rewards and resets the weekly Redis leaderboard/prize pool.
- Optionally records durable production persistence data when PostgreSQL and MongoDB URLs are configured.
- Shows selected player context with the selected player, 3 players above, and 2 players below.

## UI Features

The React dashboard includes discovery features that make the leaderboard easier to explore:

- Search players by username or `playerId`.
- Filter by country for global comparison.
- Choose a player from the selected player dropdown.
- Update selected player rank and nearby players based on the selected player.
- Preview weekly rewards in the reward preview section.
- Simulate player earnings with the earning simulation form.
- Use the same dashboard comfortably on desktop and mobile with a responsive layout.

These UI features address the case requirements around discoverability, global comparison, and letting players quickly see their own rank in context.

## Run Full Local Infrastructure With Docker Compose

The repository includes a root-level `docker-compose.yml` for local Redis, PostgreSQL, and MongoDB. These credentials are simple local development values only and must not be reused in production.

```bash
docker compose up -d
docker compose ps
```

Stop the local infrastructure:

```bash
docker compose down
```

Redis is required for the leaderboard because it is the real-time ranking engine. PostgreSQL and MongoDB are optional persistence layers in this demo; they are included in Docker Compose because they are part of the intended production stack.

Local Docker Compose environment values:

```text
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://panteon:panteon@localhost:5433/panteon_leaderboard
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=panteon_leaderboard
```

Run Redis locally:

```bash
docker run --name panteon-redis -p 6379:6379 -d redis:7
```

If the container already exists:

```bash
docker start panteon-redis
```

Run the backend:

```bash
cd server
npm install
npm run dev
```

Backend environment values can be placed in `server/.env` or configured by the host:

```text
PORT=4000
CLIENT_URL=http://localhost:5173
REDIS_URL=redis://localhost:6379
DATABASE_URL=
MONGODB_URI=
MONGODB_DB_NAME=panteon_leaderboard
ADMIN_API_KEY=
```

`DATABASE_URL`, `MONGODB_URI`, and `MONGODB_DB_NAME` are optional in this demo. If PostgreSQL or MongoDB are not configured, the API continues to run with Redis leaderboard behavior and safely skips production persistence writes.

`ADMIN_API_KEY` protects internal/demo admin endpoints when configured. If it is not configured, the admin guard is disabled so local setup remains easy.

Run the frontend:

```bash
cd client
npm install
npm run dev
```

Seed Redis before testing Redis-backed endpoints:

```bash
curl -X POST http://localhost:4000/api/leaderboard/seed \
  -H "x-admin-api-key: change-me-for-production"
```

The small seed endpoint creates only the 10 hand-written demo players. To demonstrate large-scale Redis ranking behavior without rendering or storing all players in the UI, seed generated demo players with the large seed endpoint:

```bash
curl -X POST "http://localhost:4000/api/leaderboard/seed-large?count=10000" \
  -H "x-admin-api-key: change-me-for-production"
```

`count` defaults to `10000` and is capped at `100000` for local safety. The generated players use IDs such as `player-1` through `player-N`, varied countries, generated usernames, and varied scores. `player-6` still exists, and selected-player context can also be tested with players outside the top 100 such as `player-500`, `player-5000`, or `player-9999`.

## API Endpoints

Health:

```bash
curl http://localhost:4000/health
curl http://localhost:4000/api/system/stack
```

`GET /api/system/stack` reports which infrastructure parts are configured:

```json
{
  "success": true,
  "data": {
    "node": true,
    "redis": true,
    "postgresConfigured": true,
    "mongoConfigured": true,
    "leaderboardEngine": "redis-sorted-set"
  }
}
```

Players:

```bash
curl http://localhost:4000/api/players
curl http://localhost:4000/api/players/player-1
```

Leaderboard:

```bash
curl http://localhost:4000/api/leaderboard/top
curl http://localhost:4000/api/leaderboard/player/player-6
curl http://localhost:4000/api/leaderboard/redis/top
curl http://localhost:4000/api/leaderboard/redis/player/player-6
curl http://localhost:4000/api/leaderboard/redis/player/player-5000
```

Submit an earning:

```bash
curl -X POST http://localhost:4000/api/earnings \
  -H "Content-Type: application/json" \
  -d "{\"playerId\":\"player-6\",\"amount\":250}"
```

Preview weekly rewards:

```bash
curl http://localhost:4000/api/rewards/weekly-preview
```

Distribute weekly rewards and reset weekly Redis state:

```bash
curl -X POST http://localhost:4000/api/rewards/distribute-weekly \
  -H "x-admin-api-key: change-me-for-production"
```

## Admin Endpoints

The demo includes internal/admin-like endpoints for seeding Redis and running weekly reward distribution:

- `POST /api/leaderboard/seed`
- `POST /api/leaderboard/seed-large?count=10000`
- `POST /api/rewards/distribute-weekly`

In production these endpoints should not be publicly callable. Configure `ADMIN_API_KEY` on the server and send it with the `x-admin-api-key` request header:

```bash
curl -X POST http://localhost:4000/api/leaderboard/seed \
  -H "x-admin-api-key: change-me-for-production"
```

```bash
curl -X POST "http://localhost:4000/api/leaderboard/seed-large?count=10000" \
  -H "x-admin-api-key: change-me-for-production"
```

```bash
curl -X POST http://localhost:4000/api/rewards/distribute-weekly \
  -H "x-admin-api-key: change-me-for-production"
```

When `ADMIN_API_KEY` is not configured, the guard allows these requests for local/demo convenience.

Production API examples:

```bash
curl https://panteon-leaderboard-case-3.onrender.com/health
curl https://panteon-leaderboard-case-3.onrender.com/api/system/stack
curl https://panteon-leaderboard-case-3.onrender.com/api/leaderboard/redis/top
curl https://panteon-leaderboard-case-3.onrender.com/api/rewards/weekly-preview
```

## Weekly Reward Rules

- 2% of weekly earnings goes to the prize pool.
- 1st place receives 20% of the prize pool.
- 2nd place receives 15%.
- 3rd place receives 10%.
- Ranks 4-100 share the remaining 55% by rank-based weight.

`GET /api/rewards/weekly-preview` calculates the current distribution without mutating Redis.

`POST /api/rewards/distribute-weekly` calculates the current distribution, returns `totalWeeklyEarning`, `prizePool`, `distribution`, and `rewards`, then resets the weekly Redis leaderboard and prize pool. A Redis lock prevents overlapping distribution runs in this demo. In production, the same flow should persist settlement and reward payout rows in PostgreSQL before reset.

The same distribution logic is also exposed as `runWeeklyRewardDistributionJob()` in `server/src/jobs/weeklyRewardJob.ts`. It does not start an automatic interval inside the app; it is intended to be triggered by an external scheduler such as Render Cron Job, GitHub Actions, or another trusted worker.

## Production Deployment Notes

Render backend:

- Set the root or build command for the `server` project.
- Use `npm install`, `npm run build`, and `npm start`.
- Configure `PORT`, `CLIENT_URL`, and `REDIS_URL`.
- Keep the backend stateless so multiple Render instances can serve the same API.

Vercel frontend:

- Deploy the `client` project.
- Configure the client API base URL to point at the Render backend.
- Keep secrets out of the client bundle.

Upstash Redis:

- Use the Upstash Redis URL as `REDIS_URL`.
- Enable TLS if required by the connection URL.
- Size Redis memory for active weekly leaderboard keys and retention.
- Use separate keys by week, region, mode, or shard if the leaderboard grows beyond a single global board.

## Production Data Architecture

Redis is the hot-path ranking store. It remains responsible for real-time leaderboard ranking because sorted-set operations keep score updates, top 100 reads, and rank lookups fast. PostgreSQL and MongoDB are optional production persistence adapters in this demo; missing database URLs do not stop local development.

PostgreSQL should store durable, auditable records:

- `players`
- earning ledger rows
- reward transactions
- weekly settlements
- idempotency keys for earning and payout requests

MongoDB should store flexible high-volume documents:

- game events
- player activity logs
- analytics events
- telemetry
- denormalized player or leaderboard read models

The current server includes safe persistence adapter methods:

- `recordEarningLedger(...)`
- `recordRewardDistribution(...)`
- `recordWeeklySettlement(...)`
- `recordGameEvent(...)`

When `DATABASE_URL` is configured, PostgreSQL writes are attempted for earning ledger, reward distribution, and weekly settlement records. When `MONGODB_URI` is configured, game/activity events are inserted into MongoDB. If either database is not configured or a write fails, the API logs a short message and preserves the existing Redis-backed response flow.

## Database Schema

PostgreSQL schema file:

```text
server/db/schema.sql
```

It defines:

- `players`
- `earning_ledger`
- `reward_distributions`
- `weekly_settlements`

The schema includes IDs, player fields, username fields where useful, amount fields, `week_id`, timestamps, and indexes for `player_id`, `week_id`, and `created_at`. Docker Compose mounts this file into the PostgreSQL container init directory, so it is applied when the local database volume is first created.

MongoDB index guidance:

```text
server/db/mongo-indexes.md
```

It documents intended collections for `game_events`, `player_activity_logs`, `leaderboard_events`, and `telemetry_events`, plus suggested indexes for `playerId`, `eventType`, `createdAt`, and `weekId`.

## Requirement Coverage

| Requirement | Coverage |
| --- | --- |
| Separate client and server TypeScript projects | `client` and `server` directories |
| Node.js + TypeScript + Express backend | Implemented in `server/src` |
| React + TypeScript frontend | Implemented in `client/src` |
| Redis real-time leaderboard operations | `weekly:leaderboard` Sorted Set |
| Redis Sorted Set scalable design | `ZINCRBY`, `ZREVRANGE`, and `ZREVRANK` used |
| 10 players are demo-only seed data | Documented and seeded through `/api/leaderboard/seed` |
| Large demo Redis seed | `POST /api/leaderboard/seed-large?count=10000` generates up to 100000 demo players |
| Target scale of 10M+ registered and 2M DAU | Documented in README and architecture |
| Top 100 leaderboard behavior | Redis top endpoint reads up to 100 players |
| Selected player context | Redis context endpoint returns selected player with nearby ranks |
| Weekly reward preview | `GET /api/rewards/weekly-preview` |
| Weekly reward distribution/reset | `POST /api/rewards/distribute-weekly` |
| Local full-stack infrastructure | `docker-compose.yml` |
| PostgreSQL schema | `server/db/schema.sql` |
| MongoDB collection/index notes | `server/db/mongo-indexes.md` |
| Optional PostgreSQL persistence adapter | `server/src/db/postgres.ts` and persistence service |
| Optional MongoDB persistence adapter | `server/src/db/mongo.ts` and persistence service |
| Stack status endpoint | `GET /api/system/stack` |
| PostgreSQL production role | Documented as durable financial and settlement store |
| MongoDB production role | Documented as event, activity, analytics, and telemetry store |
| Deployment notes | Render, Vercel, and Upstash Redis documented |
| AI usage disclosure | See `AI_USAGE.md` |

## Current Demo Limitations

- The seeded 10 players are sample data only.
- Player metadata is in code for demo simplicity.
- PostgreSQL and MongoDB adapters are optional and require database URLs to be configured.
- Production deployments should provision tables, indexes, retries, idempotency, and monitoring around the provided persistence adapters.
- Reward payout execution is represented by the distribution response; production would write reward transactions and settlement records to PostgreSQL.
- Authentication, authorization, rate limiting, queues, and observability are outside this demo scope.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the detailed production architecture.

See [TESTING.md](./TESTING.md) for manual local and production smoke-test steps.

# Panteon Leaderboard Case

A full-stack leaderboard case study with a TypeScript Express backend, Redis-backed weekly ranking, Redis-based reward preview logic, and a React + Vite dashboard for inspecting and simulating earnings.

## What It Does

- Displays a weekly leaderboard of players ranked by score.
- Stores the Redis leaderboard in a Sorted Set for efficient rank and score queries.
- Accepts earning submissions and increments the player's Redis leaderboard score.
- Calculates a 2% prize pool contribution from earnings.
- Provides a weekly reward preview from Redis leaderboard data.
- Includes a frontend dashboard for leaderboard, selected player context, rewards, and earning simulation.

## Tech Stack

- Backend: Node.js, Express, TypeScript
- Data store: Redis
- Redis client: ioredis
- Frontend: React, TypeScript, Vite
- Styling: Plain CSS

## Backend Architecture

The backend is organized into feature modules under `server/src/modules`:

- `players`: exposes mock player data and player lookup endpoints.
- `leaderboard`: manages mock leaderboard data, Redis seeding, Redis leaderboard reads, and player rank context.
- `earnings`: validates earning submissions, calculates contribution/net amount, and increments Redis leaderboard score.
- `rewards`: calculates weekly prize pool and reward preview from Redis leaderboard standings.

## Redis Leaderboard

The Redis leaderboard uses a Sorted Set with this key:

```text
weekly:leaderboard
```

Scores are stored as Redis sorted set scores, and player IDs are stored as members.

Main Redis operations:

- `ZADD`: seeds mock players into the leaderboard.
- `ZREVRANGE ... WITHSCORES`: reads top players in descending score order.
- `ZREVRANK`: finds a player's rank.
- `ZINCRBY`: increments a player's score after a valid earning submission.

## Earning Flow

`POST /api/earnings` validates the submitted `playerId` and `amount`, calculates the prize pool contribution, and updates the Redis leaderboard score with `ZINCRBY`.

Each valid earning contributes 2% to the prize pool:

```text
prizePoolContribution = earningAmount * 0.02
netAmount = earningAmount - prizePoolContribution
```

The response includes:

- `playerId`
- `earningAmount`
- `prizePoolContribution`
- `netAmount`
- `updatedScore`

## Reward Preview Flow

`GET /api/rewards/weekly-preview` reads the top 100 players from Redis using the leaderboard service and calculates the weekly reward preview from those Redis scores.

The reward distribution is:

- 1st place: 20%
- 2nd place: 15%
- 3rd place: 10%
- Ranks 4-100: remaining 55%, distributed by rank-based weight

## Run Redis With Docker

```bash
docker run --name panteon-redis -p 6379:6379 -d redis:7
```

If the container already exists:

```bash
docker start panteon-redis
```

## Run Backend

From `server`:

```bash
npm install
npm run dev
```

Default backend URL:

```text
http://localhost:4000
```

Environment variables can be configured with `server/src/.env`:

```text
PORT=4000
CLIENT_URL=http://localhost:5173
REDIS_URL=redis://localhost:6379
```

Seed the Redis leaderboard before using Redis leaderboard endpoints:

```bash
curl -X POST http://localhost:4000/api/leaderboard/seed
```

## Run Frontend

From `client`:

```bash
npm install
npm run dev
```

Default frontend URL:

```text
http://localhost:5173
```

The frontend expects the backend to run at:

```text
http://localhost:4000
```

## API Endpoints

### Health

- `GET /health`: checks whether the backend is running.

### Players

- `GET /api/players`: lists mock players.
- `GET /api/players/:id`: returns one mock player by ID.

### Leaderboard

- `GET /api/leaderboard/top`: returns the mock in-memory leaderboard.
- `GET /api/leaderboard/player/:playerId`: returns mock leaderboard context for a player.
- `POST /api/leaderboard/seed`: seeds the mock leaderboard into Redis.
- `GET /api/leaderboard/redis/top`: returns the Redis leaderboard.
- `GET /api/leaderboard/redis/player/:playerId`: returns Redis rank context for a player.

### Earnings

- `POST /api/earnings`: records a valid earning calculation and increments the player's Redis score.

### Rewards

- `GET /api/rewards/weekly-preview`: returns weekly prize pool and reward preview calculated from Redis leaderboard data.

## Example Curl Commands

Health check:

```bash
curl http://localhost:4000/health
```

Seed Redis leaderboard:

```bash
curl -X POST http://localhost:4000/api/leaderboard/seed
```

Get Redis leaderboard:

```bash
curl http://localhost:4000/api/leaderboard/redis/top
```

Get Redis context for `player-6`:

```bash
curl http://localhost:4000/api/leaderboard/redis/player/player-6
```

Submit an earning:

```bash
curl -X POST http://localhost:4000/api/earnings \
  -H "Content-Type: application/json" \
  -d "{\"playerId\":\"player-6\",\"amount\":250}"
```

Get weekly reward preview:

```bash
curl http://localhost:4000/api/rewards/weekly-preview
```

## Assumptions and Limitations

- Player and leaderboard data are mock datasets, not persisted in a database.
- Redis stores leaderboard scores only; player metadata comes from the mock leaderboard data.
- The reward preview treats Redis leaderboard score as weekly earning for calculation purposes.
- Earning submissions update Redis leaderboard scores but are not stored as transaction history.
- Redis leaderboard and reward preview endpoints require Redis to be running and seeded.
- Authentication, authorization, pagination, and production observability are outside the current scope.

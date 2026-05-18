# Manual Smoke Testing

This guide covers manual smoke tests for the local and deployed leaderboard app. Commands use placeholder admin values only; do not commit or share real secrets.

The 10 seeded players are demo data only. The production design targets large-scale ranking with Redis Sorted Sets, where score updates, top leaderboard reads, and player rank lookups stay fast on hot leaderboard data.

## Local Setup

1. Start local infrastructure:

```bash
docker compose up -d
docker compose ps
```

Expected outcome: Redis, PostgreSQL, and MongoDB containers are up and healthy/running.

2. Start the backend:

```bash
cd server
npm install
npm run dev
```

Expected outcome: the API starts on `http://localhost:4000`.

3. Start the frontend in another terminal:

```bash
cd client
npm install
npm run dev
```

Expected outcome: the Vite app starts on `http://localhost:5173`.

## Local API Tests

If `ADMIN_API_KEY` is configured, admin endpoints require this header:

```text
x-admin-api-key: <ADMIN_API_KEY>
```

If `ADMIN_API_KEY` is not configured, the admin guard is disabled for local/demo convenience and the same admin requests work without the header.

1. Check health:

```bash
curl http://localhost:4000/health
```

Expected outcome: the API returns an OK health response.

2. Check stack status:

```bash
curl http://localhost:4000/api/system/stack
```

Expected outcome: `success: true`, Redis is reported as enabled, configured persistence adapters are shown, and `adminGuardEnabled` reflects whether `ADMIN_API_KEY` is configured.

3. Seed the leaderboard:

```bash
curl -X POST http://localhost:4000/api/leaderboard/seed \
  -H "x-admin-api-key: <ADMIN_API_KEY>"
```

Expected outcome: `success: true` and Redis is populated with the 10 demo players.

4. Test top 100:

```bash
curl "http://localhost:4000/api/leaderboard/redis/top?limit=100"
```

Expected outcome: `success: true` and the available demo players are returned in descending score order.

5. Test selected player context:

```bash
curl http://localhost:4000/api/leaderboard/redis/player/player-6
```

Expected outcome: `success: true`, selected player context is returned for `player-6`, and nearby players are included when available.

6. Test earning update:

```bash
curl -X POST http://localhost:4000/api/earnings \
  -H "Content-Type: application/json" \
  -d "{\"playerId\":\"player-6\",\"amount\":250}"
```

Expected outcome: `success: true`, the updated score is returned, and later leaderboard reads reflect the change.

7. Test weekly preview:

```bash
curl http://localhost:4000/api/rewards/weekly-preview
```

Expected outcome: `success: true`, with `totalWeeklyEarning`, `prizePool`, and reward preview rows.

8. Test weekly distribution:

```bash
curl -X POST http://localhost:4000/api/rewards/distribute-weekly \
  -H "x-admin-api-key: <ADMIN_API_KEY>"
```

Expected outcome: `success: true`, calculated rewards are returned, and the weekly leaderboard plus prize pool are reset.

Important: `distribute-weekly` resets the leaderboard and prize pool. Seed again after testing it:

```bash
curl -X POST http://localhost:4000/api/leaderboard/seed \
  -H "x-admin-api-key: <ADMIN_API_KEY>"
```

Expected outcome: demo data is available again for API and frontend checks.

## Production Test Flow

Live URLs:

- Frontend: https://panteon-leaderboard-case.vercel.app
- Backend: https://panteon-leaderboard-case-3.onrender.com

1. Open the frontend:

```text
https://panteon-leaderboard-case.vercel.app
```

Expected outcome: the dashboard loads and supports leaderboard search, country filtering, selected-player context, reward preview, and earning simulation.

2. Check backend health:

```bash
curl https://panteon-leaderboard-case-3.onrender.com/health
```

Expected outcome: the API returns an OK health response.

3. Check backend stack status:

```bash
curl https://panteon-leaderboard-case-3.onrender.com/api/system/stack
```

Expected outcome: `success: true`; infrastructure flags and `adminGuardEnabled` are visible, but no secret values are exposed.

4. Seed the production demo leaderboard if needed:

```bash
curl -X POST https://panteon-leaderboard-case-3.onrender.com/api/leaderboard/seed \
  -H "x-admin-api-key: <ADMIN_API_KEY>"
```

Expected outcome: `success: true` when the provided key matches the configured production admin key. If the key is missing or wrong while the guard is enabled, the API returns `401` with `Unauthorized admin request`.

5. Test top 100:

```bash
curl "https://panteon-leaderboard-case-3.onrender.com/api/leaderboard/redis/top?limit=100"
```

Expected outcome: `success: true` and the available leaderboard rows are returned.

6. Test selected player context:

```bash
curl https://panteon-leaderboard-case-3.onrender.com/api/leaderboard/redis/player/player-6
```

Expected outcome: `success: true` and selected-player context is returned when `player-6` exists in the active leaderboard.

7. Test earning update:

```bash
curl -X POST https://panteon-leaderboard-case-3.onrender.com/api/earnings \
  -H "Content-Type: application/json" \
  -d "{\"playerId\":\"player-6\",\"amount\":250}"
```

Expected outcome: `success: true` and the updated score is returned.

8. Test weekly preview:

```bash
curl https://panteon-leaderboard-case-3.onrender.com/api/rewards/weekly-preview
```

Expected outcome: `success: true`, with current preview totals and reward rows.

9. Test weekly distribution:

```bash
curl -X POST https://panteon-leaderboard-case-3.onrender.com/api/rewards/distribute-weekly \
  -H "x-admin-api-key: <ADMIN_API_KEY>"
```

Expected outcome: `success: true` when authorized, calculated rewards are returned, and the weekly leaderboard plus prize pool are reset.

Important: `distribute-weekly` resets the leaderboard and prize pool. Seed again after testing it:

```bash
curl -X POST https://panteon-leaderboard-case-3.onrender.com/api/leaderboard/seed \
  -H "x-admin-api-key: <ADMIN_API_KEY>"
```

Expected outcome: demo leaderboard data is restored for the deployed frontend.

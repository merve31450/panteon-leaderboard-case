# Manual Smoke Testing

This guide covers quick manual checks for the leaderboard API and dashboard. Commands use placeholder admin values only; do not commit or share real secrets.

## Local Test Flow

1. Start local infrastructure:

```bash
docker compose up -d
```

Expected outcome: Redis, PostgreSQL, and MongoDB containers start successfully.

2. Start the backend:

```bash
cd server
npm install
npm run dev
```

Expected outcome: the API starts on `http://localhost:4000`.

3. Start the frontend:

```bash
cd client
npm install
npm run dev
```

Expected outcome: the Vite app starts on `http://localhost:5173`.

4. Seed the leaderboard:

```bash
curl -X POST http://localhost:4000/api/leaderboard/seed \
  -H "x-admin-api-key: change-me-for-production"
```

Expected outcome: the response has `success: true` and Redis is populated with demo players.

If `ADMIN_API_KEY` is not configured, the admin guard is disabled for local/demo convenience and the same request works without the header:

```bash
curl -X POST http://localhost:4000/api/leaderboard/seed
```

5. Test top 100:

```bash
curl http://localhost:4000/api/leaderboard/redis/top
```

Expected outcome: the response has `success: true` and returns the available seeded players in descending score order. The demo has 10 seeded players, so it returns fewer than 100.

6. Test player context:

```bash
curl http://localhost:4000/api/leaderboard/redis/player/player-6
```

Expected outcome: the response has `success: true`, includes the selected player when present, and includes nearby players around that rank.

7. Test earning update:

```bash
curl -X POST http://localhost:4000/api/earnings \
  -H "Content-Type: application/json" \
  -d "{\"playerId\":\"player-6\",\"amount\":250}"
```

Expected outcome: the response has `success: true`, includes the updated score, and subsequent leaderboard reads reflect the new score.

8. Test weekly preview:

```bash
curl http://localhost:4000/api/rewards/weekly-preview
```

Expected outcome: the response has `success: true`, includes `totalWeeklyEarning`, `prizePool`, and reward preview rows.

9. Test weekly distribution/reset:

```bash
curl -X POST http://localhost:4000/api/rewards/distribute-weekly \
  -H "x-admin-api-key: change-me-for-production"
```

Expected outcome: the response has `success: true`, includes the calculated distribution/rewards, and resets the weekly Redis leaderboard state.

If `ADMIN_API_KEY` is not configured, the same request can be made without the header:

```bash
curl -X POST http://localhost:4000/api/rewards/distribute-weekly
```

10. Seed again after reset:

```bash
curl -X POST http://localhost:4000/api/leaderboard/seed \
  -H "x-admin-api-key: change-me-for-production"
```

Expected outcome: the demo leaderboard is repopulated and the frontend can show leaderboard data again.

## Production Test Flow

Live URLs:

- Backend API: https://panteon-leaderboard-case-3.onrender.com
- Frontend: https://panteon-leaderboard-case.vercel.app

1. Check backend health:

```bash
curl https://panteon-leaderboard-case-3.onrender.com/health
```

Expected outcome: the API returns an OK health response.

2. Check stack status:

```bash
curl https://panteon-leaderboard-case-3.onrender.com/api/system/stack
```

Expected outcome: the response has `success: true` and reports configured infrastructure without exposing secret values.

3. Seed the production demo leaderboard if needed:

```bash
curl -X POST https://panteon-leaderboard-case-3.onrender.com/api/leaderboard/seed \
  -H "x-admin-api-key: change-me-for-production"
```

Expected outcome: the response has `success: true` when the provided admin key matches the configured production value.

If production `ADMIN_API_KEY` is configured and the header is missing or invalid, expected outcome is:

```json
{
  "success": false,
  "message": "Unauthorized admin request"
}
```

4. Test top 100:

```bash
curl https://panteon-leaderboard-case-3.onrender.com/api/leaderboard/redis/top
```

Expected outcome: the response has `success: true` and returns the available leaderboard rows.

5. Test player context:

```bash
curl https://panteon-leaderboard-case-3.onrender.com/api/leaderboard/redis/player/player-6
```

Expected outcome: the response has `success: true` and returns selected-player context plus nearby players when `player-6` exists in the active leaderboard.

6. Test earning update:

```bash
curl -X POST https://panteon-leaderboard-case-3.onrender.com/api/earnings \
  -H "Content-Type: application/json" \
  -d "{\"playerId\":\"player-6\",\"amount\":250}"
```

Expected outcome: the response has `success: true` and includes the updated score.

7. Test weekly preview:

```bash
curl https://panteon-leaderboard-case-3.onrender.com/api/rewards/weekly-preview
```

Expected outcome: the response has `success: true` and includes the current preview totals and reward rows.

8. Test weekly distribution/reset:

```bash
curl -X POST https://panteon-leaderboard-case-3.onrender.com/api/rewards/distribute-weekly \
  -H "x-admin-api-key: change-me-for-production"
```

Expected outcome: the response has `success: true` when authorized, returns calculated rewards, and resets the weekly Redis leaderboard state.

9. Seed again after reset:

```bash
curl -X POST https://panteon-leaderboard-case-3.onrender.com/api/leaderboard/seed \
  -H "x-admin-api-key: change-me-for-production"
```

Expected outcome: demo data is available again after the reset.

10. Check the frontend:

Open https://panteon-leaderboard-case.vercel.app

Expected outcome: the dashboard loads leaderboard data, supports search, country filtering, selected-player context, reward preview, and earning simulation.

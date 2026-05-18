# MongoDB Collections And Indexes

MongoDB is intended for flexible, high-volume event and analytics data. It is optional in this demo: if `MONGODB_URI` is not configured, the API skips MongoDB writes and the Redis leaderboard still works.

## Intended Collections

- `game_events`: gameplay, earning, reward, and reset events emitted by backend flows.
- `player_activity_logs`: login, session, progression, match, and player behavior records.
- `leaderboard_events`: rank changes, leaderboard snapshots, and weekly reset events.
- `telemetry_events`: technical metrics, client events, latency samples, and diagnostics.

## Suggested Indexes

Run these in `mongosh` against the local `panteon_leaderboard` database if you want local indexes:

```javascript
db.game_events.createIndex({ playerId: 1, createdAt: -1 });
db.game_events.createIndex({ eventType: 1, createdAt: -1 });
db.game_events.createIndex({ weekId: 1, createdAt: -1 });
db.game_events.createIndex({ createdAt: -1 });

db.player_activity_logs.createIndex({ playerId: 1, createdAt: -1 });
db.player_activity_logs.createIndex({ eventType: 1, createdAt: -1 });
db.player_activity_logs.createIndex({ createdAt: -1 });

db.leaderboard_events.createIndex({ playerId: 1, createdAt: -1 });
db.leaderboard_events.createIndex({ weekId: 1, createdAt: -1 });
db.leaderboard_events.createIndex({ eventType: 1, createdAt: -1 });
db.leaderboard_events.createIndex({ createdAt: -1 });

db.telemetry_events.createIndex({ playerId: 1, createdAt: -1 });
db.telemetry_events.createIndex({ eventType: 1, createdAt: -1 });
db.telemetry_events.createIndex({ weekId: 1, createdAt: -1 });
db.telemetry_events.createIndex({ createdAt: -1 });
```

For production, add TTL indexes only after retention requirements are defined.

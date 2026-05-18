import type { LeaderboardPlayer } from '../types'
import { formatNumber } from '../utils/format'

export type LeaderboardTableProps = {
  players: LeaderboardPlayer[]
  totalCount: number
}

export function LeaderboardTable({
  players,
  totalCount,
}: LeaderboardTableProps) {
  return (
    <article className="panel leaderboard-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Redis sorted set</p>
          <h2>Leaderboard</h2>
        </div>
        <span>
          {players.length} of {totalCount} players
        </span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Country</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr key={player.playerId}>
                <td>#{player.rank}</td>
                <td>
                  <strong>{player.username}</strong>
                  <span>{player.playerId}</span>
                </td>
                <td>{player.country}</td>
                <td>{formatNumber(player.score)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {players.length === 0 && (
          <p className="empty-state">No players match the current filters.</p>
        )}
      </div>
    </article>
  )
}

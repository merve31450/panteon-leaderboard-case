import type { PlayerContext } from '../types'
import { formatNumber } from '../utils/format'

type NearbyPlayersProps = {
  context: PlayerContext | null
  selectedPlayerId: string
  isLoading: boolean
}

export function NearbyPlayers({
  context,
  selectedPlayerId,
  isLoading,
}: NearbyPlayersProps) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Selected player</p>
          <h2>Nearby Players</h2>
        </div>
        <span>{selectedPlayerId}</span>
      </div>

      <div className="nearby-list">
        {isLoading && <p className="muted">Loading selected player...</p>}
        {!isLoading &&
          context?.nearbyPlayers.map((player) => (
            <div
              className={
                player.playerId === selectedPlayerId
                  ? 'nearby-player selected'
                  : 'nearby-player'
              }
              key={player.playerId}
            >
              <span>#{player.rank}</span>
              <div>
                <strong>{player.username}</strong>
                <small>{player.playerId}</small>
              </div>
              <b>{formatNumber(player.score)}</b>
            </div>
          ))}
        {!isLoading && !context?.nearbyPlayers.length && (
          <p className="empty-state">No nearby players found.</p>
        )}
      </div>
    </section>
  )
}

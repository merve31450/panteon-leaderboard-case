import type { LeaderboardPlayer } from '../types'

type FiltersBarProps = {
  countries: string[]
  countryFilter: string
  isPlayerLoading: boolean
  players: LeaderboardPlayer[]
  searchTerm: string
  selectedPlayerId: string
  onCountryFilterChange: (country: string) => void
  onSearchTermChange: (searchTerm: string) => void
  onSelectedPlayerChange: (playerId: string) => void
}

export function FiltersBar({
  countries,
  countryFilter,
  isPlayerLoading,
  players,
  searchTerm,
  selectedPlayerId,
  onCountryFilterChange,
  onSearchTermChange,
  onSelectedPlayerChange,
}: FiltersBarProps) {
  return (
    <section className="controls-panel panel" aria-label="Leaderboard filters">
      <label>
        Search players
        <input
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          placeholder="Username or player ID"
        />
      </label>
      <label>
        Country
        <select
          value={countryFilter}
          onChange={(event) => onCountryFilterChange(event.target.value)}
        >
          <option value="all">All countries</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </label>
      <label>
        Selected player
        <select
          value={selectedPlayerId}
          onChange={(event) => onSelectedPlayerChange(event.target.value)}
          disabled={isPlayerLoading}
        >
          {players.map((player) => (
            <option key={player.playerId} value={player.playerId}>
              {player.username} ({player.playerId})
            </option>
          ))}
        </select>
      </label>
    </section>
  )
}

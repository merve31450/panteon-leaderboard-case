import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { API_BASE_URL } from './config/api'
import './App.css'

const DEFAULT_SELECTED_PLAYER_ID = 'player-6'

type LeaderboardPlayer = {
  rank: number
  playerId: string
  username: string
  country: string
  score: number
}

type PlayerContext = {
  player?: LeaderboardPlayer
  nearbyPlayers: LeaderboardPlayer[]
}

type RewardPreviewItem = {
  rank: number
  playerId: string
  username: string
  score: number
  rewardAmount: number
  rewardPercentage: number
}

type RewardPreview = {
  weekId: string
  totalWeeklyEarning: number
  prizePool: number
  rewards: RewardPreviewItem[]
}

type ApiResponse<T> = {
  success: boolean
  data?: T
  message?: string
}

type EarningResult = {
  playerId: string
  earningAmount: number
  prizePoolContribution: number
  netAmount: number
  updatedScore: number
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  })
  const payload = (await response.json()) as ApiResponse<T>

  if (!response.ok || !payload.success || payload.data === undefined) {
    throw new Error(payload.message || 'Request failed')
  }

  return payload.data
}

const formatNumber = (value?: number) =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value ?? 0)

const formatMoney = (value?: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value ?? 0)

const getPreferredPlayerId = (
  players: LeaderboardPlayer[],
  preferredPlayerId: string,
) => {
  const playerIds = players.map((player) => player.playerId)

  if (playerIds.includes(preferredPlayerId)) {
    return preferredPlayerId
  }

  if (playerIds.includes(DEFAULT_SELECTED_PLAYER_ID)) {
    return DEFAULT_SELECTED_PLAYER_ID
  }

  return players[0]?.playerId ?? DEFAULT_SELECTED_PLAYER_ID
}

function App() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([])
  const [playerContext, setPlayerContext] = useState<PlayerContext | null>(null)
  const [rewardPreview, setRewardPreview] = useState<RewardPreview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPlayerLoading, setIsPlayerLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlayerId, setSelectedPlayerId] = useState(
    DEFAULT_SELECTED_PLAYER_ID,
  )
  const [earningPlayerId, setEarningPlayerId] = useState(
    DEFAULT_SELECTED_PLAYER_ID,
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [countryFilter, setCountryFilter] = useState('all')
  const [amount, setAmount] = useState('250')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [lastEarning, setLastEarning] = useState<EarningResult | null>(null)
  const selectedPlayerIdRef = useRef(DEFAULT_SELECTED_PLAYER_ID)

  const loadPlayerContext = useCallback(async (nextPlayerId: string) => {
    setIsPlayerLoading(true)
    setError(null)

    try {
      const context = await requestJson<PlayerContext>(
        `/api/leaderboard/redis/player/${nextPlayerId}`,
      )

      setPlayerContext(context)
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to load selected player',
      )
    } finally {
      setIsPlayerLoading(false)
    }
  }, [])

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [topPlayers, preview] = await Promise.all([
        requestJson<LeaderboardPlayer[]>('/api/leaderboard/redis/top'),
        requestJson<RewardPreview>('/api/rewards/weekly-preview'),
      ])
      const nextSelectedPlayerId = getPreferredPlayerId(
        topPlayers,
        selectedPlayerIdRef.current,
      )
      const context = await requestJson<PlayerContext>(
        `/api/leaderboard/redis/player/${nextSelectedPlayerId}`,
      )

      selectedPlayerIdRef.current = nextSelectedPlayerId
      setLeaderboard(topPlayers)
      setSelectedPlayerId(nextSelectedPlayerId)
      setEarningPlayerId(nextSelectedPlayerId)
      setPlayerContext(context)
      setRewardPreview(preview)
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to load dashboard data',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDashboard()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadDashboard])

  const topThree = useMemo(() => leaderboard.slice(0, 3), [leaderboard])
  const countries = useMemo(
    () =>
      Array.from(new Set(leaderboard.map((player) => player.country))).sort(
        (first, second) => first.localeCompare(second),
      ),
    [leaderboard],
  )
  const filteredLeaderboard = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return leaderboard.filter((player) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        player.username.toLowerCase().includes(normalizedSearch) ||
        player.playerId.toLowerCase().includes(normalizedSearch)
      const matchesCountry =
        countryFilter === 'all' || player.country === countryFilter

      return matchesSearch && matchesCountry
    })
  }, [countryFilter, leaderboard, searchTerm])

  const handleSelectedPlayerChange = async (nextPlayerId: string) => {
    selectedPlayerIdRef.current = nextPlayerId
    setSelectedPlayerId(nextPlayerId)
    setEarningPlayerId(nextPlayerId)
    await loadPlayerContext(nextPlayerId)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)
    setLastEarning(null)

    try {
      const earning = await requestJson<EarningResult>('/api/earnings', {
        method: 'POST',
        body: JSON.stringify({
          playerId: earningPlayerId,
          amount: Number(amount),
        }),
      })

      setLastEarning(earning)
      await loadDashboard()
    } catch (caughtError) {
      setSubmitError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to submit earning',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="dashboard">
      <header className="page-header">
        <div>
          <p className="eyebrow">Weekly competition</p>
          <h1>Panteon Leaderboard Case</h1>
        </div>
        <button type="button" onClick={loadDashboard} disabled={isLoading}>
          {isLoading ? 'Refreshing' : 'Refresh'}
        </button>
      </header>

      {error && <div className="alert error">{error}</div>}

      <section className="summary-grid" aria-label="Dashboard summary">
        <StatCard
          label="Prize Pool"
          value={formatMoney(rewardPreview?.prizePool)}
        />
        <StatCard
          label="Total Weekly Earning"
          value={formatNumber(rewardPreview?.totalWeeklyEarning)}
        />
        <StatCard
          label="Selected Player Rank"
          value={playerContext?.player ? `#${playerContext.player.rank}` : '-'}
        />
      </section>

      {isLoading ? (
        <section className="panel">
          <p className="muted">Loading leaderboard data...</p>
        </section>
      ) : (
        <>
          <section className="top-three" aria-label="Top three players">
            {topThree.map((player) => (
              <article key={player.playerId}>
                <span className="rank">#{player.rank}</span>
                <h2>{player.username}</h2>
                <p>{player.country}</p>
                <strong>{formatNumber(player.score)}</strong>
              </article>
            ))}
          </section>

          <section
            className="controls-panel panel"
            aria-label="Leaderboard filters"
          >
            <label>
              Search players
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Username or player ID"
              />
            </label>
            <label>
              Country
              <select
                value={countryFilter}
                onChange={(event) => setCountryFilter(event.target.value)}
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
                onChange={(event) =>
                  void handleSelectedPlayerChange(event.target.value)
                }
                disabled={isPlayerLoading}
              >
                {leaderboard.map((player) => (
                  <option key={player.playerId} value={player.playerId}>
                    {player.username} ({player.playerId})
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="content-grid">
            <LeaderboardTable
              players={filteredLeaderboard}
              totalCount={leaderboard.length}
            />

            <aside className="side-stack">
              <NearbyPlayers
                context={playerContext}
                selectedPlayerId={selectedPlayerId}
                isLoading={isPlayerLoading}
              />

              <EarningForm
                amount={amount}
                isSubmitting={isSubmitting}
                lastEarning={lastEarning}
                players={leaderboard}
                playerId={earningPlayerId}
                submitError={submitError}
                onAmountChange={setAmount}
                onPlayerIdChange={setEarningPlayerId}
                onSubmit={handleSubmit}
              />
            </aside>
          </section>

          <RewardPreviewSection rewardPreview={rewardPreview} />
        </>
      )}
    </main>
  )
}

type StatCardProps = {
  label: string
  value: string
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

type LeaderboardTableProps = {
  players: LeaderboardPlayer[]
  totalCount: number
}

function LeaderboardTable({ players, totalCount }: LeaderboardTableProps) {
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

type NearbyPlayersProps = {
  context: PlayerContext | null
  selectedPlayerId: string
  isLoading: boolean
}

function NearbyPlayers({
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

type EarningFormProps = {
  amount: string
  isSubmitting: boolean
  lastEarning: EarningResult | null
  players: LeaderboardPlayer[]
  playerId: string
  submitError: string | null
  onAmountChange: (amount: string) => void
  onPlayerIdChange: (playerId: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

function EarningForm({
  amount,
  isSubmitting,
  lastEarning,
  players,
  playerId,
  submitError,
  onAmountChange,
  onPlayerIdChange,
  onSubmit,
}: EarningFormProps) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Simulation</p>
          <h2>Add Earning</h2>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <label>
          Player ID
          <select
            value={playerId}
            onChange={(event) => onPlayerIdChange(event.target.value)}
          >
            {players.map((player) => (
              <option key={player.playerId} value={player.playerId}>
                {player.username} ({player.playerId})
              </option>
            ))}
          </select>
        </label>
        <label>
          Amount
          <input
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={(event) => onAmountChange(event.target.value)}
          />
        </label>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting' : 'Submit earning'}
        </button>
      </form>

      {submitError && <div className="alert error">{submitError}</div>}
      {lastEarning && (
        <div className="alert success">
          Updated {lastEarning.playerId} to{' '}
          {formatNumber(lastEarning.updatedScore)}
        </div>
      )}
    </section>
  )
}

type RewardPreviewSectionProps = {
  rewardPreview: RewardPreview | null
}

function RewardPreviewSection({ rewardPreview }: RewardPreviewSectionProps) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{rewardPreview?.weekId}</p>
          <h2>Reward Preview</h2>
        </div>
      </div>

      <div className="reward-list">
        {rewardPreview?.rewards.slice(0, 10).map((reward) => (
          <div key={reward.playerId}>
            <span>#{reward.rank}</span>
            <strong>{reward.username}</strong>
            <small>{reward.rewardPercentage}%</small>
            <b>{formatMoney(reward.rewardAmount)}</b>
          </div>
        ))}
      </div>
    </section>
  )
}

export default App

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { EarningForm } from './components/EarningForm'
import { FiltersBar } from './components/FiltersBar'
import { LeaderboardTable } from './components/LeaderboardTable'
import { NearbyPlayers } from './components/NearbyPlayers'
import { RewardPreview } from './components/RewardPreview'
import { StatCard } from './components/StatCard'
import { API_BASE_URL } from './config/api'
import type {
  ApiResponse,
  EarningResult,
  LeaderboardPlayer,
  PlayerContext,
  RewardPreview as RewardPreviewData,
} from './types'
import { formatMoney, formatNumber } from './utils/format'
import './App.css'

const DEFAULT_SELECTED_PLAYER_ID = 'player-6'

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
  const [rewardPreview, setRewardPreview] =
    useState<RewardPreviewData | null>(null)
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
        requestJson<RewardPreviewData>('/api/rewards/weekly-preview'),
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

          <FiltersBar
            countries={countries}
            countryFilter={countryFilter}
            isPlayerLoading={isPlayerLoading}
            players={leaderboard}
            searchTerm={searchTerm}
            selectedPlayerId={selectedPlayerId}
            onCountryFilterChange={setCountryFilter}
            onSearchTermChange={setSearchTerm}
            onSelectedPlayerChange={(playerId) =>
              void handleSelectedPlayerChange(playerId)
            }
          />

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

          <RewardPreview rewardPreview={rewardPreview} />
        </>
      )}
    </main>
  )
}

export default App

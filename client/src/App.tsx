import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { API_BASE_URL } from './config/api'
import './App.css'

const SELECTED_PLAYER_ID = 'player-6'

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

function App() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([])
  const [playerContext, setPlayerContext] = useState<PlayerContext | null>(null)
  const [rewardPreview, setRewardPreview] = useState<RewardPreview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playerId, setPlayerId] = useState(SELECTED_PLAYER_ID)
  const [amount, setAmount] = useState('250')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [lastEarning, setLastEarning] = useState<EarningResult | null>(null)

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [topPlayers, context, preview] = await Promise.all([
        requestJson<LeaderboardPlayer[]>('/api/leaderboard/redis/top'),
        requestJson<PlayerContext>(
          `/api/leaderboard/redis/player/${SELECTED_PLAYER_ID}`,
        ),
        requestJson<RewardPreview>('/api/rewards/weekly-preview'),
      ])

      setLeaderboard(topPlayers)
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
    void loadDashboard()
  }, [loadDashboard])

  const topThree = useMemo(() => leaderboard.slice(0, 3), [leaderboard])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)
    setLastEarning(null)

    try {
      const earning = await requestJson<EarningResult>('/api/earnings', {
        method: 'POST',
        body: JSON.stringify({
          playerId,
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
        <article>
          <span>Prize Pool</span>
          <strong>{formatMoney(rewardPreview?.prizePool)}</strong>
        </article>
        <article>
          <span>Total Weekly Earning</span>
          <strong>{formatNumber(rewardPreview?.totalWeeklyEarning)}</strong>
        </article>
        <article>
          <span>Selected Player Rank</span>
          <strong>
            {playerContext?.player ? `#${playerContext.player.rank}` : '-'}
          </strong>
        </article>
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

          <section className="content-grid">
            <article className="panel leaderboard-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Redis sorted set</p>
                  <h2>Leaderboard</h2>
                </div>
                <span>{leaderboard.length} players</span>
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
                    {leaderboard.map((player) => (
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
              </div>
            </article>

            <aside className="side-stack">
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Selected player</p>
                    <h2>Nearby Players</h2>
                  </div>
                  <span>{SELECTED_PLAYER_ID}</span>
                </div>

                <div className="nearby-list">
                  {playerContext?.nearbyPlayers.map((player) => (
                    <div
                      className={
                        player.playerId === SELECTED_PLAYER_ID
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
                </div>
              </section>

              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Simulation</p>
                    <h2>Add Earning</h2>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  <label>
                    Player ID
                    <input
                      value={playerId}
                      onChange={(event) => setPlayerId(event.target.value)}
                      placeholder="player-6"
                    />
                  </label>
                  <label>
                    Amount
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
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
            </aside>
          </section>

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
        </>
      )}
    </main>
  )
}

export default App

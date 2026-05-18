import type {
  EarningResult,
  FormSubmitHandler,
  LeaderboardPlayer,
} from '../types'
import { formatNumber } from '../utils/format'

export type EarningFormProps = {
  amount: string
  isSubmitting: boolean
  lastEarning: EarningResult | null
  players: LeaderboardPlayer[]
  playerId: string
  submitError: string | null
  onAmountChange: (amount: string) => void
  onPlayerIdChange: (playerId: string) => void
  onSubmit: FormSubmitHandler
}

export function EarningForm({
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

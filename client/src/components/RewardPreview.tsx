import type { RewardPreview as RewardPreviewData } from '../types'
import { formatMoney } from '../utils/format'

type RewardPreviewProps = {
  rewardPreview: RewardPreviewData | null
}

export function RewardPreview({ rewardPreview }: RewardPreviewProps) {
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

export type ScaleDemoCardProps = {
  renderedCount: number
  selectedPlayerRank?: number
}

export function ScaleDemoCard({
  renderedCount,
  selectedPlayerRank,
}: ScaleDemoCardProps) {
  const isShowingTop100 = renderedCount === 100
  const isSelectedOutsideTop100 =
    selectedPlayerRank !== undefined && selectedPlayerRank > 100

  return (
    <section className="scale-demo-card" aria-label="Scale demo information">
      <div>
        <p className="eyebrow">Scale demo</p>
        <h2>Large-scale Redis leaderboard demo</h2>
        <p>
          The dashboard renders the top leaderboard slice while Redis keeps the
          full ranked set fast for lookups.
        </p>
      </div>

      <div className="scale-demo-facts">
        <span>{isShowingTop100 ? 'Showing Top 100' : 'Top 100 rendered in the table'}</span>
        <span>Selected player context works outside Top 100</span>
        <span>Try player-5000 after large seed</span>
      </div>

      {isSelectedOutsideTop100 && (
        <p className="scale-demo-note">
          Selected player is outside Top 100 but still ranked with nearby
          players.
        </p>
      )}
    </section>
  )
}

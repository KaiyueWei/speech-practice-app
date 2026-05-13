const BULLET_ICONS = {
  positive: '✓',
  warning: '⚠',
  tip: '💡',
}

const SCORE_DIMS = ['clarity', 'pace', 'structure']

function ScoreBar({ label, value }) {
  return (
    <div className="score-bar-row">
      <span className="score-label">{label}</span>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        className="score-bar"
      >
        <div className="score-fill" style={{ width: `${value}%` }} />
      </div>
      <span className="score-value">{value}</span>
    </div>
  )
}

export default function FeedbackPanel({ scores, bullets }) {
  return (
    <div className="feedback-panel">
      <div className="score-bars">
        {SCORE_DIMS.map(dim => (
          <ScoreBar key={dim} label={dim} value={scores[dim] ?? 0} />
        ))}
      </div>
      <ul className="bullet-list">
        {bullets.map((b, i) => (
          <li key={i} data-testid="bullet-item" className={`bullet-${b.type}`}>
            <span className="bullet-icon">{BULLET_ICONS[b.type]}</span>
            <span className="bullet-text">{b.text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
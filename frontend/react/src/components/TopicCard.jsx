import { useState, useCallback } from 'react'

export default function TopicCard({ topic, difficulty, category, onSpin }) {
  const [spinning, setSpinning] = useState(false)

  const handleSpin = useCallback(() => {
    onSpin?.()
    setSpinning(true)
    setTimeout(() => setSpinning(false), 600)
  }, [onSpin])

  return (
    <div className="topic-card">
      <div data-testid="topic-wrapper" className={spinning ? 'spinning' : ''}>
        <p className="topic-text">{topic}</p>
        <span className="difficulty-badge">{difficulty}</span>
        <span className="category-tag">{category}</span>
      </div>
      <button type="button" onClick={handleSpin}>New topic</button>
    </div>
  )
}
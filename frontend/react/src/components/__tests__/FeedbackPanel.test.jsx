import { render, screen } from '@testing-library/react'
import FeedbackPanel from '../FeedbackPanel'

const scores = { clarity: 80, pace: 65, structure: 72 }
const bullets = [
  { type: 'positive', text: 'Good eye contact' },
  { type: 'warning', text: 'Too many filler words' },
  { type: 'tip', text: 'Use the STAR framework' },
]

describe('FeedbackPanel', () => {
  it('score bars have aria-valuenow matching each score', () => {
    render(<FeedbackPanel scores={scores} bullets={[]} />)
    expect(screen.getByRole('progressbar', { name: /clarity/i }))
      .toHaveAttribute('aria-valuenow', '80')
    expect(screen.getByRole('progressbar', { name: /pace/i }))
      .toHaveAttribute('aria-valuenow', '65')
    expect(screen.getByRole('progressbar', { name: /structure/i }))
      .toHaveAttribute('aria-valuenow', '72')
  })

  it('bullet items render with correct icon per type', () => {
    render(<FeedbackPanel scores={scores} bullets={bullets} />)
    const items = screen.getAllByTestId('bullet-item')
    expect(items[0]).toHaveTextContent('✓')
    expect(items[1]).toHaveTextContent('⚠')
    expect(items[2]).toHaveTextContent('💡')
  })
})
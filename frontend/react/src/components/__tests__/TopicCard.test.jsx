import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import TopicCard from '../TopicCard'

describe('TopicCard', () => {
  const defaultProps = {
    topic: 'Tell me about a time you led a team',
    difficulty: 'medium',
    category: 'Leadership',
    onSpin: vi.fn(),
  }

  it('renders topic text, difficulty badge, and category tag', () => {
    render(<TopicCard {...defaultProps} />)
    expect(screen.getByText('Tell me about a time you led a team')).toBeInTheDocument()
    expect(screen.getByText('medium')).toBeInTheDocument()
    expect(screen.getByText('Leadership')).toBeInTheDocument()
  })

  it('clicking "New topic" button calls onSpin prop', async () => {
    const onSpin = vi.fn()
    render(<TopicCard {...defaultProps} onSpin={onSpin} />)
    await userEvent.click(screen.getByRole('button', { name: /new topic/i }))
    expect(onSpin).toHaveBeenCalledTimes(1)
  })

  it('applies "spinning" class to topic wrapper while spinning', async () => {
    render(<TopicCard {...defaultProps} />)
    const btn = screen.getByRole('button', { name: /new topic/i })
    await userEvent.click(btn)
    const wrapper = screen.getByTestId('topic-wrapper')
    expect(wrapper).toHaveClass('spinning')
  })
})
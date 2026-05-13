import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FrameworkHints from '../FrameworkHints'

describe('FrameworkHints', () => {
  it('renders STAR content by default; clicking PREP shows PREP content', async () => {
    render(<FrameworkHints />)
    expect(screen.getByRole('tabpanel')).toHaveTextContent(/situation/i)
    await userEvent.click(screen.getByRole('tab', { name: /prep/i }))
    expect(screen.getByRole('tabpanel')).toHaveTextContent(/point/i)
  })

  it('all 4 tab buttons are present with role="tab"', () => {
    render(<FrameworkHints />)
    const tabs = screen.getAllByRole('tab')
    const names = tabs.map(t => t.textContent)
    expect(names).toEqual(expect.arrayContaining(['STAR', 'PREP', 'PPF', 'MECE']))
  })

  it('active tab has aria-selected="true"', async () => {
    render(<FrameworkHints />)
    expect(screen.getByRole('tab', { name: 'STAR' })).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(screen.getByRole('tab', { name: 'MECE' }))
    expect(screen.getByRole('tab', { name: 'MECE' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'STAR' })).toHaveAttribute('aria-selected', 'false')
  })
})
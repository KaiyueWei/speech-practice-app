import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChakraProvider } from '@chakra-ui/react'
import theme from '../../../theme'
import AppTopBar from '../AppTopBar'

function renderWithTheme(ui) {
  return render(<ChakraProvider theme={theme}>{ui}</ChakraProvider>)
}

describe('<AppTopBar />', () => {
  it('renders the speak.practice wordmark', () => {
    renderWithTheme(<AppTopBar />)
    expect(screen.getByText(/speak/i)).toBeInTheDocument()
    expect(screen.getByText(/practice/i)).toBeInTheDocument()
  })

  it('renders the four modes from the backend enum and highlights the active one', () => {
    renderWithTheme(<AppTopBar mode="IMPROMPTU" onModeChange={() => {}} />)
    const modes = ['Impromptu', 'Prepared', 'Interview', 'Debate']
    modes.forEach((label) => {
      expect(screen.getByRole('tab', { name: label })).toBeInTheDocument()
    })
    expect(screen.getByRole('tab', { name: 'Impromptu' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('fires onModeChange with the backend enum value when a pill is clicked', async () => {
    const onModeChange = vi.fn()
    renderWithTheme(<AppTopBar mode="IMPROMPTU" onModeChange={onModeChange} />)
    await userEvent.click(screen.getByRole('tab', { name: 'Debate' }))
    expect(onModeChange).toHaveBeenCalledWith('DEBATE')
  })

  it('renders a right-side slot for status / actions', () => {
    renderWithTheme(
      <AppTopBar mode="IMPROMPTU" rightSlot={<span>session-status</span>} />,
    )
    expect(screen.getByText('session-status')).toBeInTheDocument()
  })
})

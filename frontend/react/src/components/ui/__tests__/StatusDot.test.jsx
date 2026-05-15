import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import theme from '../../../theme'
import StatusDot from '../StatusDot'

function renderWithTheme(ui) {
  return render(<ChakraProvider theme={theme}>{ui}</ChakraProvider>)
}

describe('<StatusDot />', () => {
  it.each(['ready', 'recording', 'processing', 'done'])(
    'renders the %s status with label',
    (status) => {
      renderWithTheme(<StatusDot status={status} label={`status-${status}`} />)
      const dot = screen.getByTestId('status-dot')
      expect(dot).toHaveAttribute('data-status', status)
      expect(screen.getByText(`status-${status}`)).toBeInTheDocument()
    },
  )

  it('exposes an aria-live region for screen readers', () => {
    renderWithTheme(<StatusDot status="recording" label="Recording" />)
    const live = screen.getByText('Recording').closest('[aria-live]')
    expect(live).not.toBeNull()
  })
})
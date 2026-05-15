import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import theme from '../../../theme'
import ScoreBar from '../ScoreBar'

function renderWithTheme(ui) {
  return render(<ChakraProvider theme={theme}>{ui}</ChakraProvider>)
}

describe('<ScoreBar />', () => {
  it('renders label, value, and an accessible progressbar', () => {
    renderWithTheme(<ScoreBar label="Clarity" value={82} dimension="clarity" />)
    expect(screen.getByText('Clarity')).toBeInTheDocument()
    expect(screen.getByText('82')).toBeInTheDocument()

    const bar = screen.getByRole('progressbar', { name: /clarity/i })
    expect(bar).toHaveAttribute('aria-valuenow', '82')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
  })

  it('clamps values outside 0..100', () => {
    renderWithTheme(<ScoreBar label="Pace" value={120} dimension="delivery" />)
    expect(screen.getByRole('progressbar', { name: /pace/i })).toHaveAttribute(
      'aria-valuenow',
      '100',
    )
  })

  it('exposes the dimension as data attribute for theming', () => {
    renderWithTheme(<ScoreBar label="Structure" value={50} dimension="structure" />)
    expect(screen.getByRole('progressbar', { name: /structure/i })).toHaveAttribute(
      'data-dimension',
      'structure',
    )
  })
})

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import theme from '../../../theme'
import Pill from '../Pill'

function renderWithTheme(ui) {
  return render(<ChakraProvider theme={theme}>{ui}</ChakraProvider>)
}

describe('<Pill />', () => {
  it('renders children with the given variant', () => {
    renderWithTheme(<Pill variant="easy">Easy</Pill>)
    const el = screen.getByText('Easy')
    expect(el).toBeInTheDocument()
    expect(el).toHaveAttribute('data-variant', 'easy')
  })

  it.each(['easy', 'medium', 'hard', 'mode', 'tag', 'recording', 'done'])(
    'supports the %s variant',
    (variant) => {
      renderWithTheme(<Pill variant={variant}>label</Pill>)
      expect(screen.getByText('label')).toHaveAttribute('data-variant', variant)
    },
  )

  it('falls back to the tag variant when no variant is supplied', () => {
    renderWithTheme(<Pill>fallback</Pill>)
    expect(screen.getByText('fallback')).toHaveAttribute('data-variant', 'tag')
  })
})
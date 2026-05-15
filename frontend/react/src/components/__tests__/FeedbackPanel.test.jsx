import { render, screen } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import theme from '../../theme'
import FeedbackPanel from '../FeedbackPanel'

const scores = { clarity: 80, structure: 72, delivery: 65 }
const bullets = [
  { type: 'positive', text: 'Good eye contact' },
  { type: 'warning', text: 'Too many filler words' },
  { type: 'tip', text: 'Use the STAR framework' },
]

function renderWithTheme(ui) {
  return render(<ChakraProvider theme={theme}>{ui}</ChakraProvider>)
}

describe('FeedbackPanel', () => {
  it('renders the three backend-aligned score bars with their values', () => {
    renderWithTheme(<FeedbackPanel scores={scores} bullets={[]} />)
    expect(screen.getByRole('progressbar', { name: /clarity/i }))
      .toHaveAttribute('aria-valuenow', '80')
    expect(screen.getByRole('progressbar', { name: /structure/i }))
      .toHaveAttribute('aria-valuenow', '72')
    expect(screen.getByRole('progressbar', { name: /delivery/i }))
      .toHaveAttribute('aria-valuenow', '65')
  })

  it('does not render a pace score bar (pace is not part of the LLM scores map)', () => {
    renderWithTheme(<FeedbackPanel scores={scores} bullets={[]} />)
    expect(screen.queryByRole('progressbar', { name: /pace/i })).toBeNull()
  })

  it('bullet items render with correct icon per type', () => {
    renderWithTheme(<FeedbackPanel scores={scores} bullets={bullets} />)
    const items = screen.getAllByTestId('bullet-item')
    expect(items[0]).toHaveTextContent('✓')
    expect(items[1]).toHaveTextContent('⚠')
    expect(items[2]).toHaveTextContent('💡')
  })

  it('renders wpm when provided', () => {
    renderWithTheme(
      <FeedbackPanel scores={scores} bullets={[]} wpm={148} fillerWords={{}} />,
    )
    expect(screen.getByText(/148/)).toBeInTheDocument()
    expect(screen.getByText(/wpm/i)).toBeInTheDocument()
  })

  it('renders filler word counts as tagged chips', () => {
    renderWithTheme(
      <FeedbackPanel
        scores={scores}
        bullets={[]}
        wpm={148}
        fillerWords={{ um: 2, like: 1 }}
      />,
    )
    expect(screen.getByText(/um/i)).toBeInTheDocument()
    expect(screen.getByText(/like/i)).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('omits the delivery metrics card when no wpm or fillerWords are provided', () => {
    renderWithTheme(<FeedbackPanel scores={scores} bullets={[]} />)
    expect(screen.queryByText(/wpm/i)).toBeNull()
  })
})

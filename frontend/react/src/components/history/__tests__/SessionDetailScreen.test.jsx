import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ChakraProvider } from '@chakra-ui/react'
import theme from '../../../theme'
import SessionDetailScreen from '../SessionDetailScreen'

const mockGetDetail = vi.fn()

vi.mock('../../../services/client', () => ({
  getSessionDetail: (...args) => mockGetDetail(...args),
}))

function renderAt(id) {
  return render(
    <ChakraProvider theme={theme}>
      <MemoryRouter initialEntries={[`/sessions/${id}`]}>
        <Routes>
          <Route path="/sessions/:id" element={<SessionDetailScreen />} />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>,
  )
}

describe('<SessionDetailScreen />', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches the session by route id and renders prompt, transcript, scores and bullets', async () => {
    mockGetDetail.mockResolvedValue({
      id: 7,
      status: 'DONE',
      promptText: 'Explain why error messages matter',
      transcriptText: 'um well structured response',
      wpm: 142,
      fillerWords: { um: 1 },
      scores: { clarity: 80, structure: 75, delivery: 70 },
      bullets: [{ type: 'positive', text: 'Good hook' }],
      createdAt: '2026-05-14T10:00:00Z',
    })

    renderAt(7)

    await waitFor(() => expect(mockGetDetail).toHaveBeenCalledWith('7'))
    expect(
      await screen.findByText('Explain why error messages matter'),
    ).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: /clarity/i })).toHaveAttribute(
      'aria-valuenow',
      '80',
    )
    expect(screen.getByText('Good hook')).toBeInTheDocument()
  })

  it('shows an error message when the fetch fails', async () => {
    mockGetDetail.mockRejectedValue(new Error('not found'))
    renderAt(99)
    await waitFor(() =>
      expect(screen.getByText(/couldn.?t load session/i)).toBeInTheDocument(),
    )
  })
})

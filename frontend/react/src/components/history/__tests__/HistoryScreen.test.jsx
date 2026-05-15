import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ChakraProvider } from '@chakra-ui/react'
import theme from '../../../theme'
import HistoryScreen from '../HistoryScreen'

const mockGetSessions = vi.fn()
const mockNavigate = vi.fn()

vi.mock('../../../services/client', () => ({
  getSessions: (...args) => mockGetSessions(...args),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function renderHistory() {
  return render(
    <ChakraProvider theme={theme}>
      <MemoryRouter initialEntries={['/history']}>
        <Routes>
          <Route path="/history" element={<HistoryScreen />} />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>,
  )
}

describe('<HistoryScreen />', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches and renders the session list with prompt text and status pill', async () => {
    mockGetSessions.mockResolvedValue({
      content: [
        { id: 1, status: 'DONE', promptText: 'Explain why error messages matter', createdAt: '2026-05-14T14:32:00Z' },
        { id: 2, status: 'FAILED', promptText: 'Pitch your idea', createdAt: '2026-05-13T09:18:00Z' },
      ],
      totalElements: 2,
    })

    renderHistory()

    await waitFor(() =>
      expect(screen.getByText('Explain why error messages matter')).toBeInTheDocument(),
    )
    expect(screen.getByText('Pitch your idea')).toBeInTheDocument()
    expect(screen.getByText(/done/i)).toBeInTheDocument()
    expect(screen.getByText(/failed/i)).toBeInTheDocument()
  })

  it('shows an empty state when there are no sessions', async () => {
    mockGetSessions.mockResolvedValue({ content: [], totalElements: 0 })
    renderHistory()
    await waitFor(() => expect(screen.getByText(/no sessions yet/i)).toBeInTheDocument())
  })

  it('clicking a row navigates to /sessions/:id', async () => {
    mockGetSessions.mockResolvedValue({
      content: [
        { id: 7, status: 'DONE', promptText: 'Row click test', createdAt: '2026-05-14T10:00:00Z' },
      ],
      totalElements: 1,
    })
    renderHistory()
    const row = await screen.findByText('Row click test')
    await userEvent.click(row)
    expect(mockNavigate).toHaveBeenCalledWith('/sessions/7')
  })
})

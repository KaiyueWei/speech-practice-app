import { render as rtlRender, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import PracticeScreen from '../PracticeScreen'

const render = (ui) => rtlRender(<MemoryRouter>{ui}</MemoryRouter>)
const rerenderInRouter = (rerender, ui) => rerender(<MemoryRouter>{ui}</MemoryRouter>)

const TOPICS = [
  { id: 1, text: 'Describe a challenge you overcame', difficulty: 'medium', category: 'Resilience' },
  { id: 2, text: 'Tell me about a team success', difficulty: 'easy', category: 'Teamwork' },
]

const mockFeedbackMessage = {
  transcriptText: 'I um overcame the challenge well',
  scores: { clarity: 80, structure: 75, delivery: 70 },
  wpm: 142,
  fillerWords: { um: 1 },
  bullets: [
    { type: 'positive', text: 'Clear structure' },
    { type: 'tip', text: 'Reduce filler words' },
  ],
}

let mockIsRecording = false
let mockPermissionError = false
let mockFeedback = null
let mockStart = vi.fn()
let mockStop = vi.fn()

let mockCreateSession = vi.fn(() => Promise.resolve({ sessionId: 42, uploadUrl: 'https://s3/up' }))
let mockUpload = vi.fn(() => Promise.resolve())
let mockMarkRecorded = vi.fn(() => Promise.resolve())
let mockGetPrompts = vi.fn(() => Promise.resolve(TOPICS))

vi.mock('../../services/client', () => ({
  createSession: (...args) => mockCreateSession(...args),
  uploadAudioToPresignedUrl: (...args) => mockUpload(...args),
  markSessionRecorded: (...args) => mockMarkRecorded(...args),
  getPrompts: (...args) => mockGetPrompts(...args),
}))

vi.mock('../../hooks/useMediaRecorder', () => ({
  useMediaRecorder: vi.fn(({ onStop } = {}) => {
    mockMediaOnStop = onStop
    return {
      start: mockStart,
      stop: mockStop,
      isRecording: mockIsRecording,
      permissionError: mockPermissionError,
    }
  }),
}))

let mockMediaOnStop = null
let mockIsTimedOut = false
let mockRetry = vi.fn()

vi.mock('../../hooks/useWebSocket', () => ({
  useWebSocket: vi.fn(() => ({
    feedbackMessage: mockFeedback,
    isConnected: true,
    isTimedOut: mockIsTimedOut,
    retry: mockRetry,
  })),
}))

describe('PracticeScreen', () => {
  beforeEach(() => {
    mockIsRecording = false
    mockPermissionError = false
    mockFeedback = null
    mockIsTimedOut = false
    mockRetry.mockReset()
    mockStart.mockReset()
    mockStop.mockReset()
    mockCreateSession.mockClear()
    mockUpload.mockClear()
    mockMarkRecorded.mockClear()
    mockCreateSession.mockResolvedValue({ sessionId: 42, uploadUrl: 'https://s3/up' })
    mockUpload.mockResolvedValue()
    mockMarkRecorded.mockResolvedValue()
    mockGetPrompts.mockResolvedValue(TOPICS)
    vi.clearAllMocks()
  })

  it('fetches prompts for the initial mode on mount and renders the first topic', async () => {
    render(<PracticeScreen />)
    await waitFor(() => expect(mockGetPrompts).toHaveBeenCalledWith('IMPROMPTU'))
    await waitFor(() =>
      expect(screen.getByText('Describe a challenge you overcame')).toBeInTheDocument(),
    )
  })

  it('refetches prompts when the user switches mode', async () => {
    mockGetPrompts.mockResolvedValueOnce(TOPICS)
    render(<PracticeScreen />)
    await waitFor(() => expect(mockGetPrompts).toHaveBeenCalledWith('IMPROMPTU'))

    mockGetPrompts.mockResolvedValueOnce([
      { id: 9, text: 'Should we tax sugar', difficulty: 'hard', category: 'Policy' },
    ])
    await userEvent.click(screen.getByRole('tab', { name: 'Debate' }))
    await waitFor(() => expect(mockGetPrompts).toHaveBeenCalledWith('DEBATE'))
    await waitFor(() =>
      expect(screen.getByText('Should we tax sugar')).toBeInTheDocument(),
    )
  })

  it('full flow: spin → topic shown → record clicked → feedback visible after WS message', async () => {
    const { rerender } = render(<PracticeScreen />)

    const spin = await screen.findByRole('button', { name: /new topic/i })
    await userEvent.click(spin)
    expect(screen.getByTestId('topic-wrapper')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /start recording/i }))
    await waitFor(() => expect(mockCreateSession).toHaveBeenCalledTimes(1))
    expect(mockStart).toHaveBeenCalled()

    mockFeedback = mockFeedbackMessage
    rerenderInRouter(rerender, <PracticeScreen />)

    expect(screen.getByRole('progressbar', { name: /clarity/i })).toBeInTheDocument()
  })

  it('uploads blob and marks recorded after media recorder finalizes', async () => {
    render(<PracticeScreen />)
    const recordBtn = await screen.findByRole('button', { name: /start recording/i })
    await userEvent.click(recordBtn)
    await waitFor(() => expect(mockCreateSession).toHaveBeenCalled())

    const blob = new Blob(['audio'], { type: 'audio/webm' })
    await act(async () => {
      await mockMediaOnStop(blob, 7)
    })

    expect(mockUpload).toHaveBeenCalledWith('https://s3/up', blob)
    expect(mockMarkRecorded).toHaveBeenCalledWith(42, 7)
  })

  it('shows retry button when WS is timed out and clicking it calls retry()', async () => {
    mockIsTimedOut = true
    render(<PracticeScreen />)
    const button = await screen.findByRole('button', { name: /retry/i })
    await userEvent.click(button)
    expect(mockRetry).toHaveBeenCalled()
  })

  it('shows "Microphone access denied" when permissionError is true', () => {
    mockPermissionError = true
    render(<PracticeScreen />)
    expect(screen.getByText(/microphone access denied/i)).toBeInTheDocument()
  })
})

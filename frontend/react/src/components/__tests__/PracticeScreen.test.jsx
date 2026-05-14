import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import PracticeScreen from '../PracticeScreen'

const TOPICS = [
  { id: 1, text: 'Describe a challenge you overcame', difficulty: 'medium', category: 'Resilience' },
  { id: 2, text: 'Tell me about a team success', difficulty: 'easy', category: 'Teamwork' },
]

const mockFeedbackMessage = {
  transcript: 'I um overcame the challenge well',
  scores: { clarity: 80, pace: 70, structure: 75 },
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

vi.mock('../../services/client', () => ({
  createSession: (...args) => mockCreateSession(...args),
  uploadAudioToPresignedUrl: (...args) => mockUpload(...args),
  markSessionRecorded: (...args) => mockMarkRecorded(...args),
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

vi.mock('../../hooks/useWebSocket', () => ({
  useWebSocket: vi.fn(() => ({
    feedbackMessage: mockFeedback,
    isConnected: true,
  })),
}))

describe('PracticeScreen', () => {
  beforeEach(() => {
    mockIsRecording = false
    mockPermissionError = false
    mockFeedback = null
    mockStart.mockReset()
    mockStop.mockReset()
    mockCreateSession.mockClear()
    mockUpload.mockClear()
    mockMarkRecorded.mockClear()
    mockCreateSession.mockResolvedValue({ sessionId: 42, uploadUrl: 'https://s3/up' })
    mockUpload.mockResolvedValue()
    mockMarkRecorded.mockResolvedValue()
    vi.clearAllMocks()
  })

  it('full flow: spin → topic shown → record clicked → feedback visible after WS message', async () => {
    const { rerender } = render(<PracticeScreen initialTopics={TOPICS} />)

    await userEvent.click(screen.getByRole('button', { name: /new topic/i }))
    expect(screen.getByTestId('topic-wrapper')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /start recording/i }))
    await waitFor(() => expect(mockCreateSession).toHaveBeenCalledTimes(1))
    expect(mockStart).toHaveBeenCalled()

    mockFeedback = mockFeedbackMessage
    rerender(<PracticeScreen initialTopics={TOPICS} />)

    expect(screen.getByRole('progressbar', { name: /clarity/i })).toBeInTheDocument()
  })

  it('uploads blob and marks recorded after media recorder finalizes', async () => {
    render(<PracticeScreen initialTopics={TOPICS} />)
    await userEvent.click(screen.getByRole('button', { name: /start recording/i }))
    await waitFor(() => expect(mockCreateSession).toHaveBeenCalled())

    const blob = new Blob(['audio'], { type: 'audio/webm' })
    await act(async () => {
      await mockMediaOnStop(blob)
    })

    expect(mockUpload).toHaveBeenCalledWith('https://s3/up', blob)
    expect(mockMarkRecorded).toHaveBeenCalledWith(42)
  })

  it('shows "Microphone access denied" when permissionError is true', () => {
    mockPermissionError = true
    render(<PracticeScreen initialTopics={TOPICS} />)
    expect(screen.getByText(/microphone access denied/i)).toBeInTheDocument()
  })
})

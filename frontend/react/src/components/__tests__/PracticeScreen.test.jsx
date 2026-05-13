import { render, screen, act } from '@testing-library/react'
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

// Mock hooks
let mockIsRecording = false
let mockPermissionError = false
let mockFeedback = null
let mockStart = vi.fn()
let mockStop = vi.fn()

vi.mock('../../hooks/useMediaRecorder', () => ({
  useMediaRecorder: vi.fn(({ onStop } = {}) => ({
    start: mockStart,
    stop: mockStop,
    isRecording: mockIsRecording,
    permissionError: mockPermissionError,
  })),
}))

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
    vi.clearAllMocks()
  })

  it('full flow: spin → topic shown → record clicked → feedback visible after WS message', async () => {
    const { rerender } = render(<PracticeScreen initialTopics={TOPICS} />)

    await userEvent.click(screen.getByRole('button', { name: /new topic/i }))
    expect(screen.getByTestId('topic-wrapper')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /start recording/i }))
    expect(mockStart).toHaveBeenCalled()

    mockFeedback = mockFeedbackMessage
    rerender(<PracticeScreen initialTopics={TOPICS} />)

    expect(screen.getByRole('progressbar', { name: /clarity/i })).toBeInTheDocument()
  })

  it('shows "Microphone access denied" when permissionError is true', () => {
    mockPermissionError = true
    render(<PracticeScreen initialTopics={TOPICS} />)
    expect(screen.getByText(/microphone access denied/i)).toBeInTheDocument()
  })
})
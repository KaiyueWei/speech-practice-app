import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import RecordingSession from '../RecordingSession'

const defaultProps = {
  sessionStatus: 'idle',
  onRecord: vi.fn(),
  onStop: vi.fn(),
  barHeights: Array(80).fill(0),
}

describe('RecordingSession', () => {
  it('idle state shows "Start recording" button text', () => {
    render(<RecordingSession {...defaultProps} />)
    expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument()
  })

  it('clicking the record button calls onRecord', async () => {
    const onRecord = vi.fn()
    render(<RecordingSession {...defaultProps} onRecord={onRecord} />)
    await userEvent.click(screen.getByRole('button', { name: /start recording/i }))
    expect(onRecord).toHaveBeenCalledTimes(1)
  })

  it('recording state shows "Stop recording" button', () => {
    render(<RecordingSession {...defaultProps} sessionStatus="recording" />)
    expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument()
  })

  it('clicking stop button calls onStop', async () => {
    const onStop = vi.fn()
    render(<RecordingSession {...defaultProps} sessionStatus="recording" onStop={onStop} />)
    await userEvent.click(screen.getByRole('button', { name: /stop recording/i }))
    expect(onStop).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['idle', 'Ready'],
    ['recording', 'Recording…'],
    ['transcribing', 'Transcribing…'],
    ['done', 'Done'],
  ])('StatusBar text for %s is "%s"', (status, expected) => {
    render(<RecordingSession {...defaultProps} sessionStatus={status} />)
    expect(screen.getByTestId('status-bar')).toHaveTextContent(expected)
  })
})
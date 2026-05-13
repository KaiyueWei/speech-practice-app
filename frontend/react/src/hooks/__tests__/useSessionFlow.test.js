import { renderHook, act } from '@testing-library/react'
import { useSessionFlow } from '../useSessionFlow'

describe('useSessionFlow', () => {
  it('starts in idle state', () => {
    const { result } = renderHook(() => useSessionFlow())
    expect(result.current.status).toBe('idle')
  })

  it('startRecording transitions idle → recording', () => {
    const { result } = renderHook(() => useSessionFlow())
    act(() => result.current.startRecording())
    expect(result.current.status).toBe('recording')
  })

  it('stopRecording transitions recording → transcribing', () => {
    const { result } = renderHook(() => useSessionFlow())
    act(() => result.current.startRecording())
    act(() => result.current.stopRecording())
    expect(result.current.status).toBe('transcribing')
  })

  it('setFeedback transitions transcribing → done and stores feedback', () => {
    const { result } = renderHook(() => useSessionFlow())
    const feedback = { scores: { clarity: 80 }, bullets: [] }
    act(() => result.current.startRecording())
    act(() => result.current.stopRecording())
    act(() => result.current.setFeedback(feedback))
    expect(result.current.status).toBe('done')
    expect(result.current.feedback).toEqual(feedback)
  })

  it('setFeedback transitions recording → done directly (feedback arrives before manual stop)', () => {
    const { result } = renderHook(() => useSessionFlow())
    const feedback = { scores: { clarity: 90 }, bullets: [] }
    act(() => result.current.startRecording())
    act(() => result.current.setFeedback(feedback))
    expect(result.current.status).toBe('done')
    expect(result.current.feedback).toEqual(feedback)
  })

  it('reset transitions done → idle and clears feedback', () => {
    const { result } = renderHook(() => useSessionFlow())
    act(() => result.current.startRecording())
    act(() => result.current.stopRecording())
    act(() => result.current.setFeedback({ scores: {} }))
    act(() => result.current.reset())
    expect(result.current.status).toBe('idle')
    expect(result.current.feedback).toBeNull()
  })
})
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useMediaRecorder } from '../useMediaRecorder'

function makeMockRecorder(chunks = [new Blob(['audio'], { type: 'audio/webm' })]) {
  const listeners = {}

  const recorder = {
    start: vi.fn(),
    stop: vi.fn().mockImplementation(() => {
      chunks.forEach(chunk => {
        listeners['dataavailable']?.({ data: chunk })
      })
      listeners['stop']?.()
    }),
    addEventListener: vi.fn((event, handler) => {
      listeners[event] = handler
    }),
    removeEventListener: vi.fn(),
    state: 'inactive',
  }
  return recorder
}

describe('useMediaRecorder', () => {
  let mockRecorder
  let mockStream

  beforeEach(() => {
    mockStream = { getTracks: () => [{ stop: vi.fn() }] }
    mockRecorder = makeMockRecorder()

    vi.stubGlobal('MediaRecorder', vi.fn(() => mockRecorder))
    MediaRecorder.isTypeSupported = vi.fn(() => true)

    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('start calls getUserMedia then MediaRecorder.start', async () => {
    const { result } = renderHook(() => useMediaRecorder({ onStop: vi.fn() }))

    await act(async () => {
      await result.current.start()
    })

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true })
    expect(mockRecorder.start).toHaveBeenCalledTimes(1)
    expect(result.current.isRecording).toBe(true)
  })

  it('stop calls MediaRecorder.stop and invokes onStop with a Blob', async () => {
    const onStop = vi.fn()
    const { result } = renderHook(() => useMediaRecorder({ onStop }))

    await act(async () => {
      await result.current.start()
    })

    act(() => {
      result.current.stop()
    })

    expect(mockRecorder.stop).toHaveBeenCalledTimes(1)
    expect(onStop).toHaveBeenCalledTimes(1)
    const blob = onStop.mock.calls[0][0]
    expect(blob).toBeInstanceOf(Blob)
  })

  it('blob has non-zero size when chunks are provided', async () => {
    const fakeChunk = new Blob(['hello audio data'], { type: 'audio/webm' })
    const recorder = makeMockRecorder([fakeChunk])
    vi.stubGlobal('MediaRecorder', vi.fn(() => recorder))
    MediaRecorder.isTypeSupported = vi.fn(() => true)

    const onStop = vi.fn()
    const { result } = renderHook(() => useMediaRecorder({ onStop }))

    await act(async () => { await result.current.start() })
    act(() => { result.current.stop() })

    const blob = onStop.mock.calls[0][0]
    expect(blob.size).toBeGreaterThan(0)
  })

  it('sets permissionError when getUserMedia throws NotAllowedError', async () => {
    const err = new DOMException('Permission denied', 'NotAllowedError')
    navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(err)

    const { result } = renderHook(() => useMediaRecorder({ onStop: vi.fn() }))

    await act(async () => {
      await result.current.start()
    })

    expect(result.current.permissionError).toBe(true)
    expect(result.current.isRecording).toBe(false)
  })

  it('permissionError is false initially', () => {
    const { result } = renderHook(() => useMediaRecorder({ onStop: vi.fn() }))
    expect(result.current.permissionError).toBe(false)
  })

  it('isRecording becomes false after stop', async () => {
    const { result } = renderHook(() => useMediaRecorder({ onStop: vi.fn() }))

    await act(async () => { await result.current.start() })
    expect(result.current.isRecording).toBe(true)

    act(() => { result.current.stop() })
    expect(result.current.isRecording).toBe(false)
  })
})
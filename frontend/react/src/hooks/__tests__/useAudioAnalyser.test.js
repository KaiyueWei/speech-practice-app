import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useAudioAnalyser } from '../useAudioAnalyser'

const BAR_COUNT = 80

function makeMockAudioContext(freqData) {
  const analyser = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    fftSize: 0,
    frequencyBinCount: freqData.length,
    getByteFrequencyData: vi.fn((arr) => {
      freqData.forEach((v, i) => { arr[i] = v })
    }),
  }

  const source = {
    connect: vi.fn(),
    disconnect: vi.fn(),
  }

  const ctx = {
    createAnalyser: vi.fn(() => analyser),
    createMediaStreamSource: vi.fn(() => source),
    close: vi.fn(),
    state: 'running',
  }

  return { ctx, analyser, source }
}

describe('useAudioAnalyser', () => {
  let rafCallbacks = []
  let rafId = 0

  beforeEach(() => {
    rafCallbacks = []
    rafId = 0
    vi.stubGlobal('requestAnimationFrame', vi.fn((cb) => {
      rafCallbacks.push(cb)
      return ++rafId
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('returns 80 bar heights when stream is provided', () => {
    const freqData = Array.from({ length: 128 }, (_, i) => i * 2)
    const { ctx } = makeMockAudioContext(freqData)
    vi.stubGlobal('AudioContext', vi.fn(() => ctx))

    const mockStream = { id: 'stream-1' }
    const { result } = renderHook(() => useAudioAnalyser(mockStream))

    act(() => {
      rafCallbacks.forEach(cb => cb())
    })

    expect(result.current.barHeights).toHaveLength(BAR_COUNT)
  })

  it('bar heights are numbers between 0 and 100', () => {
    const freqData = Array.from({ length: 128 }, () => 128)
    const { ctx } = makeMockAudioContext(freqData)
    vi.stubGlobal('AudioContext', vi.fn(() => ctx))

    const mockStream = { id: 'stream-2' }
    const { result } = renderHook(() => useAudioAnalyser(mockStream))

    act(() => {
      rafCallbacks.forEach(cb => cb())
    })

    result.current.barHeights.forEach(h => {
      expect(h).toBeGreaterThanOrEqual(0)
      expect(h).toBeLessThanOrEqual(100)
    })
  })

  it('returns all-zero heights when stream is null', () => {
    const { result } = renderHook(() => useAudioAnalyser(null))

    expect(result.current.barHeights).toHaveLength(BAR_COUNT)
    result.current.barHeights.forEach(h => expect(h).toBe(0))
  })

  it('returns all-zero heights when stream is undefined', () => {
    const { result } = renderHook(() => useAudioAnalyser(undefined))

    expect(result.current.barHeights).toHaveLength(BAR_COUNT)
    result.current.barHeights.forEach(h => expect(h).toBe(0))
  })

  it('cancels animation frame and closes AudioContext on unmount', () => {
    const freqData = Array.from({ length: 128 }, () => 100)
    const { ctx } = makeMockAudioContext(freqData)
    vi.stubGlobal('AudioContext', vi.fn(() => ctx))

    const mockStream = { id: 'stream-3' }
    const { unmount } = renderHook(() => useAudioAnalyser(mockStream))

    unmount()

    expect(cancelAnimationFrame).toHaveBeenCalled()
    expect(ctx.close).toHaveBeenCalled()
  })

  it('creates AudioContext and connects source to analyser', () => {
    const freqData = Array.from({ length: 128 }, () => 50)
    const { ctx, source, analyser } = makeMockAudioContext(freqData)
    vi.stubGlobal('AudioContext', vi.fn(() => ctx))

    const mockStream = { id: 'stream-4' }
    renderHook(() => useAudioAnalyser(mockStream))

    expect(ctx.createMediaStreamSource).toHaveBeenCalledWith(mockStream)
    expect(source.connect).toHaveBeenCalledWith(analyser)
    expect(requestAnimationFrame).toHaveBeenCalled()
  })
})

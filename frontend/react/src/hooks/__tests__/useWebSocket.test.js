import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@stomp/stompjs', () => {
  const subscribeCallbacks = {}
  const mockClient = {
    activate: vi.fn(),
    deactivate: vi.fn(),
    subscribe: vi.fn((destination, cb) => {
      subscribeCallbacks[destination] = cb
      return { unsubscribe: vi.fn() }
    }),
    onConnect: null,
    onDisconnect: null,
    onStompError: null,
  }

  const Client = vi.fn(() => mockClient)

  return { Client, __mockClient: mockClient, __subscribeCallbacks: subscribeCallbacks }
})

vi.mock('sockjs-client', () => ({
  default: vi.fn(() => ({})),
}))

import * as StompModule from '@stomp/stompjs'
import { useWebSocket } from '../useWebSocket'

function getMockClient() {
  return StompModule.__mockClient
}

function getSubscribeCallbacks() {
  return StompModule.__subscribeCallbacks
}

describe('useWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(StompModule.__subscribeCallbacks).forEach(k => {
      delete StompModule.__subscribeCallbacks[k]
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('activates StompClient on mount', () => {
    renderHook(() => useWebSocket({ sessionId: 'sess-1' }))
    expect(getMockClient().activate).toHaveBeenCalledTimes(1)
  })

  it('subscribes to /topic/feedback/{sessionId} on connect', () => {
    const { result } = renderHook(() => useWebSocket({ sessionId: 'sess-42' }))

    act(() => {
      getMockClient().onConnect?.()
    })

    expect(getMockClient().subscribe).toHaveBeenCalledWith(
      '/topic/feedback/sess-42',
      expect.any(Function)
    )
    expect(result.current.isConnected).toBe(true)
  })

  it('updates feedbackMessage when a STOMP message arrives', () => {
    const { result } = renderHook(() => useWebSocket({ sessionId: 'sess-7' }))

    act(() => {
      getMockClient().onConnect?.()
    })

    const callbacks = getSubscribeCallbacks()
    act(() => {
      callbacks['/topic/feedback/sess-7']?.({ body: JSON.stringify({ text: 'Good pace!' }) })
    })

    expect(result.current.feedbackMessage).toEqual({ text: 'Good pace!' })
  })

  it('deactivates client on unmount', () => {
    const { unmount } = renderHook(() => useWebSocket({ sessionId: 'sess-3' }))
    unmount()
    expect(getMockClient().deactivate).toHaveBeenCalledTimes(1)
  })

  it('isConnected starts as false', () => {
    const { result } = renderHook(() => useWebSocket({ sessionId: 'sess-0' }))
    expect(result.current.isConnected).toBe(false)
  })

  it('isConnected becomes false on disconnect', () => {
    const { result } = renderHook(() => useWebSocket({ sessionId: 'sess-9' }))

    act(() => { getMockClient().onConnect?.() })
    expect(result.current.isConnected).toBe(true)

    act(() => { getMockClient().onDisconnect?.() })
    expect(result.current.isConnected).toBe(false)
  })

  it('isTimedOut becomes true after 60s of no message', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useWebSocket({ sessionId: 'sess-t1' }))

    act(() => { getMockClient().onConnect?.() })
    expect(result.current.isTimedOut).toBe(false)

    act(() => { vi.advanceTimersByTime(60_000) })
    expect(result.current.isTimedOut).toBe(true)

    vi.useRealTimers()
  })

  it('timeout does not fire if a message arrives within 60s', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useWebSocket({ sessionId: 'sess-t2' }))

    act(() => { getMockClient().onConnect?.() })
    act(() => { vi.advanceTimersByTime(30_000) })
    act(() => {
      getSubscribeCallbacks()['/topic/feedback/sess-t2']?.({ body: '{}' })
    })
    act(() => { vi.advanceTimersByTime(60_000) })

    expect(result.current.isTimedOut).toBe(false)
    vi.useRealTimers()
  })

  it('retry() clears isTimedOut and reactivates the client', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useWebSocket({ sessionId: 'sess-t3' }))

    act(() => { getMockClient().onConnect?.() })
    act(() => { vi.advanceTimersByTime(60_000) })
    expect(result.current.isTimedOut).toBe(true)

    const activatesBeforeRetry = getMockClient().activate.mock.calls.length
    act(() => { result.current.retry() })

    expect(result.current.isTimedOut).toBe(false)
    expect(getMockClient().activate.mock.calls.length).toBe(activatesBeforeRetry + 1)
    vi.useRealTimers()
  })

  it('reconnects with exponential backoff on STOMP error', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useWebSocket({ sessionId: 'sess-err' }))

    act(() => { getMockClient().onStompError?.({ headers: {}, body: 'err' }) })

    expect(getMockClient().activate).toHaveBeenCalledTimes(1)

    act(() => { vi.advanceTimersByTime(1000) })
    expect(getMockClient().activate).toHaveBeenCalledTimes(2)

    vi.useRealTimers()
  })
})
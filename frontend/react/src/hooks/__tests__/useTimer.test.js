import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useTimer } from '../useTimer'

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts at limit and decrements each second', () => {
    const onExpire = vi.fn()
    const { result } = renderHook(() => useTimer({ limit: 5, onExpire }))

    expect(result.current.remaining).toBe(5)

    act(() => { vi.advanceTimersByTime(1000) })
    expect(result.current.remaining).toBe(4)

    act(() => { vi.advanceTimersByTime(1000) })
    expect(result.current.remaining).toBe(3)
  })

  it('calls onExpire when remaining reaches zero', () => {
    const onExpire = vi.fn()
    const { result } = renderHook(() => useTimer({ limit: 3, onExpire }))

    act(() => { vi.advanceTimersByTime(3000) })

    expect(result.current.remaining).toBe(0)
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('does not decrement below zero', () => {
    const onExpire = vi.fn()
    const { result } = renderHook(() => useTimer({ limit: 2, onExpire }))

    act(() => { vi.advanceTimersByTime(5000) })

    expect(result.current.remaining).toBe(0)
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('setLimit resets elapsed and updates display', () => {
    const onExpire = vi.fn()
    const { result } = renderHook(() => useTimer({ limit: 10, onExpire }))

    act(() => { vi.advanceTimersByTime(4000) })
    expect(result.current.remaining).toBe(6)

    act(() => { result.current.setLimit(20) })
    expect(result.current.remaining).toBe(20)

    act(() => { vi.advanceTimersByTime(1000) })
    expect(result.current.remaining).toBe(19)
  })

  it('clears interval on unmount (no state updates after unmount)', () => {
    const onExpire = vi.fn()
    const { result, unmount } = renderHook(() => useTimer({ limit: 10, onExpire }))

    act(() => { vi.advanceTimersByTime(2000) })
    expect(result.current.remaining).toBe(8)

    unmount()

    act(() => { vi.advanceTimersByTime(5000) })
    expect(onExpire).not.toHaveBeenCalled()
  })
})

import { useState, useEffect, useRef, useCallback } from 'react'

export function useTimer({ limit, onExpire }) {
  const [remaining, setRemaining] = useState(limit)
  const limitRef = useRef(limit)
  const onExpireRef = useRef(onExpire)
  const firedRef = useRef(false)
  const intervalRef = useRef(null)

  useEffect(() => { onExpireRef.current = onExpire }, [onExpire])

  const startInterval = useCallback(() => {
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          if (!firedRef.current) {
            firedRef.current = true
            onExpireRef.current?.()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  useEffect(() => {
    limitRef.current = limit
    firedRef.current = false
    setRemaining(limit)
    startInterval()
    return () => clearInterval(intervalRef.current)
  }, [limit, startInterval])

  const setLimit = useCallback((n) => {
    firedRef.current = false
    limitRef.current = n
    setRemaining(n)
    startInterval()
  }, [startInterval])

  return { remaining, setLimit }
}

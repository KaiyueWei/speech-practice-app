import { useState, useEffect, useRef, useCallback } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const BASE_BACKOFF_MS = 1000
const MAX_BACKOFF_MS = 30000
const NO_MESSAGE_TIMEOUT_MS = 60_000

export function useWebSocket({ sessionId }) {
  const [feedbackMessage, setFeedbackMessage] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isTimedOut, setIsTimedOut] = useState(false)
  const clientRef = useRef(null)
  const retryCountRef = useRef(0)
  const retryTimerRef = useRef(null)
  const noMessageTimerRef = useRef(null)

  const armNoMessageTimer = () => {
    clearTimeout(noMessageTimerRef.current)
    noMessageTimerRef.current = setTimeout(() => {
      setIsTimedOut(true)
    }, NO_MESSAGE_TIMEOUT_MS)
  }

  useEffect(() => {
    if (!sessionId) return undefined

    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    })

    clientRef.current = client

    client.onConnect = () => {
      retryCountRef.current = 0
      setIsConnected(true)
      armNoMessageTimer()
      client.subscribe(`/topic/feedback/${sessionId}`, (message) => {
        clearTimeout(noMessageTimerRef.current)
        try {
          setFeedbackMessage(JSON.parse(message.body))
        } catch {
          setFeedbackMessage(message.body)
        }
      })
    }

    client.onDisconnect = () => {
      setIsConnected(false)
    }

    client.onStompError = () => {
      setIsConnected(false)
      const delay = Math.min(BASE_BACKOFF_MS * Math.pow(2, retryCountRef.current), MAX_BACKOFF_MS)
      retryCountRef.current += 1
      retryTimerRef.current = setTimeout(() => {
        client.activate()
      }, delay)
    }

    client.activate()

    return () => {
      clearTimeout(retryTimerRef.current)
      clearTimeout(noMessageTimerRef.current)
      client.deactivate()
    }
  }, [sessionId])

  const retry = useCallback(() => {
    setIsTimedOut(false)
    setFeedbackMessage(null)
    retryCountRef.current = 0
    if (clientRef.current) {
      clientRef.current.activate()
      armNoMessageTimer()
    }
  }, [])

  return { feedbackMessage, isConnected, isTimedOut, retry }
}

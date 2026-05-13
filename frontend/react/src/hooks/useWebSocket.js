import { useState, useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const BASE_BACKOFF_MS = 1000
const MAX_BACKOFF_MS = 30000

export function useWebSocket({ sessionId }) {
  const [feedbackMessage, setFeedbackMessage] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const clientRef = useRef(null)
  const retryCountRef = useRef(0)
  const retryTimerRef = useRef(null)

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
    })

    clientRef.current = client

    client.onConnect = () => {
      retryCountRef.current = 0
      setIsConnected(true)
      client.subscribe(`/topic/feedback/${sessionId}`, (message) => {
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
      client.deactivate()
    }
  }, [sessionId])

  return { feedbackMessage, isConnected }
}
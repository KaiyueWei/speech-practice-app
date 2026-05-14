import { useState, useEffect, useCallback, useRef } from 'react'
import { useMediaRecorder } from '../hooks/useMediaRecorder'
import { useWebSocket } from '../hooks/useWebSocket'
import { useSessionFlow } from '../hooks/useSessionFlow'
import {
  createSession,
  markSessionRecorded,
  uploadAudioToPresignedUrl,
} from '../services/client'
import TopicCard from './TopicCard'
import FrameworkHints from './FrameworkHints'
import RecordingSession from './RecordingSession'
import TranscriptView from './TranscriptView'
import FeedbackPanel from './FeedbackPanel'

export default function PracticeScreen({ initialTopics }) {
  const [topics] = useState(initialTopics)
  const [currentTopic, setCurrentTopic] = useState(topics[0] ?? null)
  const [sessionId, setSessionId] = useState(null)
  const uploadUrlRef = useRef(null)
  const sessionIdRef = useRef(null)

  const { status, feedback, startRecording, stopRecording, setFeedback } = useSessionFlow()

  const handleRecordingFinalized = useCallback(async (blob, durationSec) => {
    stopRecording()
    const uploadUrl = uploadUrlRef.current
    const currentSessionId = sessionIdRef.current
    if (!uploadUrl || !currentSessionId) return
    try {
      await uploadAudioToPresignedUrl(uploadUrl, blob)
      await markSessionRecorded(currentSessionId, durationSec)
    } catch (err) {
      console.error('Failed to upload recording or mark recorded', err)
    }
  }, [stopRecording])

  const { start, stop, isRecording, permissionError } = useMediaRecorder({
    onStop: handleRecordingFinalized,
  })

  const { feedbackMessage, isTimedOut, retry } = useWebSocket({ sessionId })

  useEffect(() => {
    if (feedbackMessage && (status === 'recording' || status === 'transcribing')) {
      if (status === 'recording') stop()
      setFeedback(feedbackMessage)
    }
  }, [feedbackMessage, status, setFeedback, stop])

  const handleSpin = useCallback(() => {
    const next = topics[Math.floor(Math.random() * topics.length)]
    setCurrentTopic(next)
  }, [topics])

  const handleRecord = useCallback(async () => {
    try {
      const session = await createSession()
      uploadUrlRef.current = session.uploadUrl
      sessionIdRef.current = session.sessionId
      setSessionId(session.sessionId)
      startRecording()
      start()
    } catch (err) {
      console.error('Failed to create session', err)
    }
  }, [startRecording, start])

  const handleStop = useCallback(() => {
    stop()
  }, [stop])

  if (permissionError) {
    return <div className="permission-error">Microphone access denied</div>
  }

  return (
    <div className="practice-screen">
      {currentTopic && (
        <TopicCard
          topic={currentTopic.text}
          difficulty={currentTopic.difficulty}
          category={currentTopic.category}
          onSpin={handleSpin}
        />
      )}
      <FrameworkHints />
      <RecordingSession
        sessionStatus={status}
        onRecord={handleRecord}
        onStop={handleStop}
        barHeights={Array(80).fill(0)}
      />
      {isTimedOut && (
        <div className="ws-timeout">
          <span>No feedback received. Connection may be stalled.</span>
          <button type="button" onClick={retry}>Retry</button>
        </div>
      )}
      {feedback?.transcriptText && <TranscriptView text={feedback.transcriptText} />}
      {status === 'done' && feedback && (
        <FeedbackPanel scores={feedback.scores} bullets={feedback.bullets} />
      )}
    </div>
  )
}

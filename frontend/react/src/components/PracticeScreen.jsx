import { useState, useEffect, useCallback } from 'react'
import { useMediaRecorder } from '../hooks/useMediaRecorder'
import { useWebSocket } from '../hooks/useWebSocket'
import { useSessionFlow } from '../hooks/useSessionFlow'
import TopicCard from './TopicCard'
import FrameworkHints from './FrameworkHints'
import RecordingSession from './RecordingSession'
import TranscriptView from './TranscriptView'
import FeedbackPanel from './FeedbackPanel'

export default function PracticeScreen({ initialTopics }) {
  const [topics] = useState(initialTopics)
  const [currentTopic, setCurrentTopic] = useState(topics[0] ?? null)
  const [sessionId] = useState(() => `session-${Date.now()}`)

  const { status, feedback, startRecording, stopRecording, setFeedback } = useSessionFlow()

  const { start, stop, isRecording, permissionError } = useMediaRecorder({
    onStop: () => stopRecording(),
  })

  const { feedbackMessage } = useWebSocket({ sessionId })

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

  const handleRecord = useCallback(() => {
    startRecording()
    start()
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
      {feedback?.transcript && <TranscriptView text={feedback.transcript} />}
      {status === 'done' && feedback && (
        <FeedbackPanel scores={feedback.scores} bullets={feedback.bullets} />
      )}
    </div>
  )
}
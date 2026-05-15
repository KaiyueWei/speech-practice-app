import { useState, useEffect, useCallback, useRef } from 'react'
import { Box, Button, Container, Flex, Text } from '@chakra-ui/react'
import { useMediaRecorder } from '../hooks/useMediaRecorder'
import { useWebSocket } from '../hooks/useWebSocket'
import { useSessionFlow } from '../hooks/useSessionFlow'
import {
  createSession,
  getPrompts,
  markSessionRecorded,
  uploadAudioToPresignedUrl,
} from '../services/client'
import AppTopBar from './ui/AppTopBar'
import TopicCard from './TopicCard'
import FrameworkHints from './FrameworkHints'
import RecordingSession from './RecordingSession'
import TranscriptView from './TranscriptView'
import FeedbackPanel from './FeedbackPanel'

export default function PracticeScreen() {
  const [topics, setTopics] = useState([])
  const [currentTopic, setCurrentTopic] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [mode, setMode] = useState('IMPROMPTU')
  const [topicsLoading, setTopicsLoading] = useState(false)
  const uploadUrlRef = useRef(null)
  const sessionIdRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    setTopicsLoading(true)
    getPrompts(mode)
      .then((list) => {
        if (cancelled) return
        const safe = Array.isArray(list) ? list : []
        setTopics(safe)
        setCurrentTopic(safe[0] ?? null)
      })
      .catch((err) => {
        if (!cancelled) console.error('Failed to load prompts', err)
      })
      .finally(() => {
        if (!cancelled) setTopicsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [mode])

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
    return (
      <Box bg="bg" minH="100vh">
        <AppTopBar mode={mode} onModeChange={setMode} />
        <Container maxW="720px" pt="48px">
          <Box
            bg="surface"
            border="0.5px solid"
            borderColor="surface3"
            borderRadius="md"
            p="20px"
            textAlign="center"
            color="ink2"
          >
            Microphone access denied
          </Box>
        </Container>
      </Box>
    )
  }

  return (
    <Box bg="bg" minH="100vh">
      <AppTopBar mode={mode} onModeChange={setMode} />
      <Container maxW="720px" pt="16px" pb="48px">
        {currentTopic ? (
          <TopicCard
            topic={currentTopic.text}
            difficulty={currentTopic.difficulty}
            category={currentTopic.category}
            onSpin={handleSpin}
          />
        ) : (
          <Box
            bg="surface"
            border="0.5px solid"
            borderColor="surface3"
            borderRadius="md"
            p="16px"
            mb="12px"
            color="ink3"
            fontSize="13px"
          >
            {topicsLoading ? 'Loading prompts…' : 'No prompts available for this mode.'}
          </Box>
        )}
        <FrameworkHints />
        <RecordingSession
          sessionStatus={status}
          onRecord={handleRecord}
          onStop={handleStop}
          barHeights={Array(80).fill(0)}
        />
        {isTimedOut && (
          <Flex
            bg="surface"
            border="0.5px solid"
            borderColor="surface3"
            borderRadius="md"
            p="12px"
            align="center"
            justify="space-between"
            gap="12px"
            mb="12px"
          >
            <Text fontSize="13px" color="ink2">
              No feedback received. Connection may be stalled.
            </Text>
            <Button
              type="button"
              onClick={retry}
              size="sm"
              bg="ink"
              color="surface"
              borderRadius="pill"
              fontSize="12px"
              _hover={{ opacity: 0.85 }}
            >
              Retry
            </Button>
          </Flex>
        )}
        {feedback?.transcriptText && <TranscriptView text={feedback.transcriptText} />}
        {status === 'done' && feedback && (
          <FeedbackPanel scores={feedback.scores} bullets={feedback.bullets} />
        )}
      </Container>
    </Box>
  )
}

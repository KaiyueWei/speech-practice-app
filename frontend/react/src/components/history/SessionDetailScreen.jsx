import { useEffect, useState } from 'react'
import { Box, Container, Flex, Spinner, Text } from '@chakra-ui/react'
import { useNavigate, useParams } from 'react-router-dom'
import AppTopBar from '../ui/AppTopBar'
import Pill from '../ui/Pill'
import TranscriptView from '../TranscriptView'
import FeedbackPanel from '../FeedbackPanel'
import { getSessionDetail } from '../../services/client'

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function SessionDetailScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getSessionDetail(id)
      .then((data) => {
        if (cancelled) return
        setDetail(data)
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to load session', err)
          setError(err)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <Box bg="bg" minH="100vh">
      <AppTopBar
        rightSlot={
          <Box
            as="button"
            type="button"
            onClick={() => navigate('/history')}
            fontSize="12px"
            color="ink2"
            _hover={{ color: 'ink' }}
            cursor="pointer"
          >
            ← History
          </Box>
        }
      />
      <Container maxW="720px" pt="16px" pb="48px">
        {loading && (
          <Flex justify="center" py="40px">
            <Spinner size="md" color="ink3" />
          </Flex>
        )}
        {!loading && error && (
          <Box
            bg="surface"
            border="0.5px solid"
            borderColor="surface3"
            borderRadius="md"
            p="20px"
            textAlign="center"
            color="ink2"
          >
            Couldn’t load session.
          </Box>
        )}
        {!loading && !error && detail && (
          <>
            <Box
              bg="surface"
              border="0.5px solid"
              borderColor="surface3"
              borderRadius="md"
              p="16px"
              mb="12px"
            >
              <Flex justify="space-between" align="center" mb="8px" gap="8px">
                <Text fontSize="11px" color="ink3" fontFamily="mono">
                  {formatDate(detail.createdAt)}
                </Text>
                <Pill variant={detail.status === 'DONE' ? 'done' : 'tag'}>
                  {detail.status}
                </Pill>
              </Flex>
              <Text
                fontFamily="heading"
                fontSize="22px"
                lineHeight="1.35"
                color="ink"
                _before={{ content: '"\\201C"', mr: '2px', color: 'ink3' }}
                _after={{ content: '"\\201D"', ml: '2px', color: 'ink3' }}
              >
                {detail.promptText}
              </Text>
            </Box>

            {detail.transcriptText && <TranscriptView text={detail.transcriptText} />}

            {(detail.scores || detail.bullets?.length || detail.wpm != null) && (
              <FeedbackPanel
                scores={detail.scores ?? {}}
                bullets={detail.bullets ?? []}
                wpm={detail.wpm}
                fillerWords={detail.fillerWords}
              />
            )}
          </>
        )}
      </Container>
    </Box>
  )
}
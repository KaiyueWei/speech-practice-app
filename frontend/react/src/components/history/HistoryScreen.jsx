import { useEffect, useState } from 'react'
import { Box, Container, Flex, HStack, Spinner, Text } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import AppTopBar from '../ui/AppTopBar'
import Pill from '../ui/Pill'
import { getSessions } from '../../services/client'

const STATUS_PILL = {
  CREATED:      { variant: 'tag', label: 'Created' },
  RECORDED:     { variant: 'tag', label: 'Recorded' },
  TRANSCRIBING: { variant: 'mode', label: 'Transcribing' },
  TRANSCRIBED:  { variant: 'mode', label: 'Transcribed' },
  GENERATING:   { variant: 'mode', label: 'Generating' },
  DONE:         { variant: 'done', label: 'Done' },
  FAILED:       { variant: 'recording', label: 'Failed' },
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function HistoryRow({ session, onClick }) {
  const status = STATUS_PILL[session.status] ?? { variant: 'tag', label: session.status }
  return (
    <Flex
      onClick={onClick}
      cursor="pointer"
      align="center"
      justify="space-between"
      gap="12px"
      py="12px"
      borderBottom="0.5px solid"
      borderColor="surface2"
      _hover={{ bg: 'surface2' }}
      _last={{ borderBottom: 'none' }}
      px="4px"
      mx="-4px"
      borderRadius="sm"
      role="button"
      tabIndex={0}
    >
      <Box flex="1" minW={0}>
        <Text
          fontSize="13px"
          color="ink"
          noOfLines={1}
          mb="2px"
        >
          {session.promptText ?? '(no prompt)'}
        </Text>
        <Text fontSize="11px" color="ink3">
          {formatDate(session.createdAt)}
        </Text>
      </Box>
      <Pill variant={status.variant}>{status.label}</Pill>
    </Flex>
  )
}

export default function HistoryScreen() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getSessions()
      .then((page) => {
        if (cancelled) return
        setSessions(Array.isArray(page?.content) ? page.content : [])
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to load sessions', err)
          setError(err)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Box bg="bg" minH="100vh">
      <AppTopBar
        rightSlot={
          <HStack as="div" spacing="8px" justify="flex-end">
            <Box
              as="button"
              type="button"
              onClick={() => navigate('/dashboard')}
              fontSize="12px"
              color="ink2"
              _hover={{ color: 'ink' }}
              cursor="pointer"
            >
              Practice
            </Box>
          </HStack>
        }
      />
      <Container maxW="720px" pt="16px" pb="48px">
        <Box
          bg="surface"
          border="0.5px solid"
          borderColor="surface3"
          borderRadius="md"
          p="14px"
        >
          <Text
            fontSize="12px"
            fontWeight={500}
            color="ink3"
            textTransform="uppercase"
            letterSpacing="0.07em"
            mb="6px"
          >
            Recent sessions
          </Text>
          {loading && (
            <Flex justify="center" py="20px">
              <Spinner size="sm" color="ink3" />
            </Flex>
          )}
          {!loading && error && (
            <Text fontSize="13px" color="ink2" py="12px">
              Couldn’t load sessions.
            </Text>
          )}
          {!loading && !error && sessions.length === 0 && (
            <Text fontSize="13px" color="ink3" py="12px">
              No sessions yet — record your first practice from the dashboard.
            </Text>
          )}
          {!loading &&
            !error &&
            sessions.map((s) => (
              <HistoryRow
                key={s.id}
                session={s}
                onClick={() => navigate(`/sessions/${s.id}`)}
              />
            ))}
        </Box>
      </Container>
    </Box>
  )
}
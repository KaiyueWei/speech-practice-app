import { Box, Button, Flex, HStack, Text } from '@chakra-ui/react'
import StatusDot from './ui/StatusDot'

const STATUS_TEXT = {
  idle: 'Ready',
  recording: 'Recording…',
  transcribing: 'Transcribing…',
  done: 'Done',
}

const STATUS_DOT = {
  idle: 'ready',
  recording: 'recording',
  transcribing: 'processing',
  done: 'done',
}

function Waveform({ barHeights }) {
  return (
    <Flex align="center" gap="2px" h="36px" aria-hidden="true" my="2px">
      {barHeights.map((h, i) => (
        <Box
          key={i}
          className="waveform-bar"
          w="3px"
          h={`${Math.max(4, h)}px`}
          bg={h > 0 ? 'accent' : 'surface2'}
          borderRadius="2px"
          transition="height .12s linear"
        />
      ))}
    </Flex>
  )
}

export default function RecordingSession({ sessionStatus, onRecord, onStop, barHeights }) {
  const isRecording = sessionStatus === 'recording'

  return (
    <Box
      bg="surface"
      border="0.5px solid"
      borderColor="surface3"
      borderRadius="md"
      p="14px"
      mb="12px"
    >
      <Flex justify="space-between" align="center" mb="12px">
        <Text fontFamily="mono" fontSize="28px" fontWeight={500} color="ink">
          0:00
        </Text>
      </Flex>
      <Waveform barHeights={barHeights} />
      <Flex align="center" gap="10px" mt="12px">
        <Button
          type="button"
          onClick={isRecording ? onStop : onRecord}
          bg={isRecording ? 'ink' : 'accent'}
          color="surface"
          borderRadius="pill"
          fontSize="13px"
          fontWeight={500}
          px="18px"
          py="9px"
          _hover={{ opacity: 0.9 }}
          _active={{ opacity: 0.8 }}
        >
          <HStack spacing="8px">
            <Box w="9px" h="9px" borderRadius="50%" bg="surface" />
            <span>{isRecording ? 'Stop recording' : 'Start recording'}</span>
          </HStack>
        </Button>
        <Text fontSize="12px" color="ink3">
          Browser mic required
        </Text>
      </Flex>
      <Box
        data-testid="status-bar"
        mt="10px"
        pt="10px"
        borderTop="0.5px solid"
        borderColor="surface2"
      >
        <StatusDot
          status={STATUS_DOT[sessionStatus] ?? 'ready'}
          label={STATUS_TEXT[sessionStatus] ?? 'Ready'}
        />
      </Box>
    </Box>
  )
}

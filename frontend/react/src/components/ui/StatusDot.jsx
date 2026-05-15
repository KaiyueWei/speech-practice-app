import { Box, HStack } from '@chakra-ui/react'
import { keyframes } from '@emotion/react'

const pulse = keyframes`
  0%, 100% { opacity: 1 }
  50%      { opacity: 0.3 }
`

const STATUS_COLORS = {
  ready:      { bg: 'ink4',   animate: false },
  recording:  { bg: 'accent', animate: true  },
  processing: { bg: 'amber',  animate: true  },
  done:       { bg: 'teal',   animate: false },
}

export default function StatusDot({ status = 'ready', label }) {
  const { bg, animate } = STATUS_COLORS[status] ?? STATUS_COLORS.ready
  return (
    <HStack spacing="8px" aria-live="polite">
      <Box
        data-testid="status-dot"
        data-status={status}
        w="8px"
        h="8px"
        borderRadius="50%"
        bg={bg}
        animation={animate ? `${pulse} 1s infinite` : undefined}
        flexShrink={0}
      />
      {label && (
        <Box as="span" fontSize="13px" color="ink2">
          {label}
        </Box>
      )}
    </HStack>
  )
}

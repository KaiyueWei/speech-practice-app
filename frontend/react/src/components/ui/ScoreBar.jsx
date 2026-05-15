import { Box, Flex } from '@chakra-ui/react'

const DIMENSION_COLORS = {
  clarity:   'teal',
  structure: 'purple',
  delivery:  'amber',
  pace:      'amber',
  fillers:   'accent',
}

function clamp(value) {
  const n = Number(value) || 0
  return Math.max(0, Math.min(100, Math.round(n)))
}

export default function ScoreBar({ label, value, dimension = 'clarity' }) {
  const v = clamp(value)
  const fillColor = DIMENSION_COLORS[dimension] ?? 'teal'

  return (
    <Box mb="10px">
      <Flex justify="space-between" fontSize="12px" mb="4px">
        <Box as="span" color="ink2">
          {label}
        </Box>
        <Box as="span" fontFamily="mono" color="ink" fontWeight={500}>
          {v}
        </Box>
      </Flex>
      <Box
        role="progressbar"
        aria-label={label}
        aria-valuenow={v}
        aria-valuemin={0}
        aria-valuemax={100}
        data-dimension={dimension}
        h="4px"
        bg="surface2"
        borderRadius="2px"
        overflow="hidden"
      >
        <Box h="4px" w={`${v}%`} bg={fillColor} borderRadius="2px" />
      </Box>
    </Box>
  )
}

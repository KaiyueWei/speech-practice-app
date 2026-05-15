import { Box, Flex, HStack, Text } from '@chakra-ui/react'
import ScoreBar from './ui/ScoreBar'
import Pill from './ui/Pill'

const BULLET_ICONS = {
  positive: '✓',
  warning: '⚠',
  tip: '💡',
}

const BULLET_COLORS = {
  positive: 'teal',
  warning: 'amber',
  tip: 'purple',
}

const SCORE_DIMS = [
  { key: 'clarity',   label: 'Clarity' },
  { key: 'structure', label: 'Structure' },
  { key: 'delivery',  label: 'Delivery' },
]

function SectionHeader({ children }) {
  return (
    <Text
      fontSize="12px"
      fontWeight={500}
      color="ink3"
      textTransform="uppercase"
      letterSpacing="0.07em"
      mb="10px"
    >
      {children}
    </Text>
  )
}

function Card({ children }) {
  return (
    <Box
      bg="surface"
      border="0.5px solid"
      borderColor="surface3"
      borderRadius="md"
      p="14px"
      mb="12px"
    >
      {children}
    </Box>
  )
}

function DeliveryMetrics({ wpm, fillerWords }) {
  const hasFillers = fillerWords && Object.keys(fillerWords).length > 0
  return (
    <Card>
      <SectionHeader>Delivery metrics</SectionHeader>
      {wpm != null && (
        <Flex justify="space-between" fontSize="13px" color="ink2" mb="8px">
          <Box as="span">WPM</Box>
          <Box as="span" fontFamily="mono" color="ink" fontWeight={500}>
            {wpm}
          </Box>
        </Flex>
      )}
      {hasFillers && (
        <>
          <Text fontSize="12px" color="ink2" mb="6px">
            Filler words
          </Text>
          <HStack spacing="4px" wrap="wrap">
            {Object.entries(fillerWords).map(([word, count]) => (
              <Pill key={word} variant="tag">
                <Box as="span">{word}</Box>
                <Box as="span" fontFamily="mono" color="ink3" ml="4px">
                  {count}
                </Box>
              </Pill>
            ))}
          </HStack>
        </>
      )}
    </Card>
  )
}

export default function FeedbackPanel({ scores, bullets = [], wpm, fillerWords }) {
  const showMetrics =
    wpm != null || (fillerWords && Object.keys(fillerWords).length > 0)

  return (
    <Box>
      <Card>
        <SectionHeader>Scores</SectionHeader>
        {SCORE_DIMS.map(({ key, label }) => (
          <ScoreBar
            key={key}
            label={label}
            value={scores?.[key] ?? 0}
            dimension={key}
          />
        ))}
      </Card>

      {showMetrics && <DeliveryMetrics wpm={wpm} fillerWords={fillerWords} />}

      {bullets.length > 0 && (
        <Card>
          <SectionHeader>AI coaching</SectionHeader>
          {bullets.map((b, i) => (
            <Flex
              key={i}
              data-testid="bullet-item"
              align="flex-start"
              gap="8px"
              py="8px"
              borderBottom={i < bullets.length - 1 ? '0.5px solid' : 'none'}
              borderColor="surface2"
              fontSize="13px"
              lineHeight="1.5"
              color="ink"
            >
              <Box
                as="span"
                fontSize="15px"
                color={BULLET_COLORS[b.type] ?? 'ink2'}
                flexShrink={0}
                mt="1px"
              >
                {BULLET_ICONS[b.type] ?? '•'}
              </Box>
              <Box as="span">{b.text}</Box>
            </Flex>
          ))}
        </Card>
      )}
    </Box>
  )
}

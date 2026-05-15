import { useState, useCallback } from 'react'
import { Box, Button, Flex, HStack, Text } from '@chakra-ui/react'
import Pill from './ui/Pill'

const DIFFICULTY_VARIANT = {
  easy: 'easy',
  medium: 'medium',
  hard: 'hard',
}

export default function TopicCard({ topic, difficulty, category, onSpin }) {
  const [spinning, setSpinning] = useState(false)

  const handleSpin = useCallback(() => {
    onSpin?.()
    setSpinning(true)
    setTimeout(() => setSpinning(false), 600)
  }, [onSpin])

  return (
    <Box
      bg="surface"
      border="0.5px solid"
      borderColor="surface3"
      borderRadius="md"
      p="16px"
      mb="12px"
    >
      <Box
        data-testid="topic-wrapper"
        className={spinning ? 'spinning' : ''}
        opacity={spinning ? 0.4 : 1}
        transition="opacity .4s"
      >
        <HStack spacing="6px" mb="10px">
          <Pill variant={DIFFICULTY_VARIANT[difficulty] ?? 'tag'}>{difficulty}</Pill>
          <Pill variant="tag">{category}</Pill>
        </HStack>
        <Text
          fontFamily="heading"
          fontSize="22px"
          lineHeight="1.35"
          color="ink"
          mb="14px"
          _before={{ content: '"\\201C"', mr: '2px', color: 'ink3' }}
          _after={{ content: '"\\201D"', ml: '2px', color: 'ink3' }}
        >
          {topic}
        </Text>
      </Box>
      <Flex align="center" gap="8px">
        <Button
          type="button"
          onClick={handleSpin}
          size="sm"
          bg="ink"
          color="surface"
          borderRadius="pill"
          fontWeight={500}
          fontSize="12px"
          px="14px"
          _hover={{ opacity: 0.85 }}
          _active={{ opacity: 0.8 }}
        >
          New topic
        </Button>
      </Flex>
    </Box>
  )
}

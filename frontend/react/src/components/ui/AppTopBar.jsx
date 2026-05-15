import { Box, Flex, HStack, Text } from '@chakra-ui/react'

const MODES = [
  { value: 'IMPROMPTU', label: 'Impromptu' },
  { value: 'PREPARED',  label: 'Prepared' },
  { value: 'INTERVIEW', label: 'Interview' },
  { value: 'DEBATE',    label: 'Debate' },
]

function Wordmark() {
  return (
    <Text fontFamily="heading" fontSize="17px" color="ink" letterSpacing="-0.01em">
      speak<Box as="span" color="accent">.</Box>practice
    </Text>
  )
}

function ModePill({ active, children, onClick }) {
  return (
    <Box
      as="button"
      type="button"
      role="tab"
      aria-selected={active ? 'true' : 'false'}
      onClick={onClick}
      fontSize="12px"
      px="12px"
      py="4px"
      borderRadius="pill"
      cursor="pointer"
      bg={active ? 'ink' : 'transparent'}
      color={active ? 'surface' : 'ink2'}
      border="0.5px solid"
      borderColor="transparent"
      transition="background-color .15s, color .15s"
      _hover={active ? {} : { color: 'ink' }}
    >
      {children}
    </Box>
  )
}

export default function AppTopBar({ mode = 'IMPROMPTU', onModeChange, rightSlot }) {
  return (
    <Flex
      align="center"
      justify="space-between"
      gap="12px"
      bg="surface"
      borderBottom="0.5px solid"
      borderColor="surface3"
      px="16px"
      py="12px"
    >
      <Wordmark />
      <HStack as="div" role="tablist" spacing="4px">
        {MODES.map((m) => (
          <ModePill
            key={m.value}
            active={mode === m.value}
            onClick={() => onModeChange?.(m.value)}
          >
            {m.label}
          </ModePill>
        ))}
      </HStack>
      <Box minW="80px" textAlign="right">
        {rightSlot}
      </Box>
    </Flex>
  )
}

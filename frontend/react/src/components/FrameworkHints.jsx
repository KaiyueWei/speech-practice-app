import { useState } from 'react'
import { Box, HStack } from '@chakra-ui/react'

const TABS = {
  STAR: {
    label: 'STAR',
    content: 'Situation → Task → Action → Result. Describe the situation and task clearly, focus on your specific actions, and quantify the result.',
  },
  PREP: {
    label: 'PREP',
    content: 'Point → Reason → Example → Point. Lead with your main point, support it with a reason, give a concrete example, then restate your point.',
  },
  PPF: {
    label: 'PPF',
    content: 'Past → Present → Future. Start with relevant past experience, connect it to your current skills, then explain how it informs your future goals.',
  },
  MECE: {
    label: 'MECE',
    content: 'Mutually Exclusive, Collectively Exhaustive. Structure your answer so each point is distinct and together they cover the full picture.',
  },
}

function TabPill({ active, children, onClick }) {
  return (
    <Box
      as="button"
      type="button"
      role="tab"
      aria-selected={active ? 'true' : 'false'}
      onClick={onClick}
      fontSize="11px"
      fontFamily="mono"
      px="10px"
      py="3px"
      borderRadius="pill"
      cursor="pointer"
      bg={active ? 'purple' : 'surface'}
      color={active ? 'surface' : 'ink2'}
      border="0.5px solid"
      borderColor={active ? 'purple' : 'surface3'}
      transition="background-color .15s, color .15s"
    >
      {children}
    </Box>
  )
}

export default function FrameworkHints() {
  const [active, setActive] = useState('STAR')

  return (
    <Box mb="12px">
      <HStack as="div" role="tablist" spacing="4px" mb="8px">
        {Object.keys(TABS).map((key) => (
          <TabPill
            key={key}
            active={active === key}
            onClick={() => setActive(key)}
          >
            {TABS[key].label}
          </TabPill>
        ))}
      </HStack>
      <Box
        role="tabpanel"
        bg="surface"
        border="0.5px solid"
        borderColor="surface3"
        borderRadius="sm"
        px="12px"
        py="10px"
        fontSize="12px"
        lineHeight="1.7"
        color="ink2"
      >
        {TABS[active].content}
      </Box>
    </Box>
  )
}

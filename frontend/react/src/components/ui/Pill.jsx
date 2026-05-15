import { Box } from '@chakra-ui/react'

const VARIANT_STYLES = {
  easy:      { bg: '#eaf3de', color: '#3b6d11' },
  medium:    { bg: 'amberLight', color: '#633806' },
  hard:      { bg: '#fcebeb', color: '#a32d2d' },
  mode:      { bg: 'purpleLight', color: '#3c3489' },
  tag:       { bg: 'surface2', color: 'ink2', fontWeight: 400 },
  recording: { bg: '#fcebeb', color: '#a32d2d' },
  done:      { bg: 'tealLight', color: '#085041' },
}

export default function Pill({ variant = 'tag', children, ...rest }) {
  const style = VARIANT_STYLES[variant] ?? VARIANT_STYLES.tag
  return (
    <Box
      as="span"
      data-variant={variant}
      display="inline-flex"
      alignItems="center"
      gap="4px"
      px="10px"
      py="3px"
      borderRadius="pill"
      fontSize="12px"
      fontWeight={500}
      lineHeight={1.4}
      {...style}
      {...rest}
    >
      {children}
    </Box>
  )
}

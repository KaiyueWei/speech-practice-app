import { extendTheme } from '@chakra-ui/react'

const colors = {
  ink: '#1a1917',
  ink2: '#5c5a55',
  ink3: '#9c998f',
  ink4: '#c8c4ba',
  bg: '#f7f4f0',
  surface: '#ffffff',
  surface2: '#f0ece5',
  surface3: '#e8e3db',
  accent: '#c84b2f',
  accentLight: '#f5ece9',
  teal: '#1d9e75',
  tealLight: '#e1f5ee',
  purple: '#534ab7',
  purpleLight: '#eeedfe',
  amber: '#ba7517',
  amberLight: '#faeeda',
}

const fonts = {
  heading: `'Instrument Serif', Georgia, serif`,
  body: `'Inter', system-ui, -apple-system, sans-serif`,
  mono: `'DM Mono', 'Courier New', monospace`,
}

const radii = {
  sm: '8px',
  md: '12px',
  lg: '18px',
  pill: '999px',
}

const styles = {
  global: {
    body: {
      bg: 'bg',
      color: 'ink',
      fontFamily: 'body',
      fontSize: '14px',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
    },
  },
}

const theme = extendTheme({ colors, fonts, radii, styles })

export default theme
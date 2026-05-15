import { describe, it, expect } from 'vitest'
import theme from '../index'

describe('design system theme', () => {
  it('exposes warm-light semantic colors matching the design HTML', () => {
    expect(theme.colors.ink).toBe('#1a1917')
    expect(theme.colors.ink2).toBe('#5c5a55')
    expect(theme.colors.ink3).toBe('#9c998f')
    expect(theme.colors.ink4).toBe('#c8c4ba')
    expect(theme.colors.bg).toBe('#f7f4f0')
    expect(theme.colors.surface).toBe('#ffffff')
    expect(theme.colors.surface2).toBe('#f0ece5')
    expect(theme.colors.surface3).toBe('#e8e3db')
    expect(theme.colors.accent).toBe('#c84b2f')
    expect(theme.colors.teal).toBe('#1d9e75')
    expect(theme.colors.purple).toBe('#534ab7')
    expect(theme.colors.amber).toBe('#ba7517')
  })

  it('uses Instrument Serif for headings and Inter for body', () => {
    expect(theme.fonts.heading).toMatch(/Instrument Serif/)
    expect(theme.fonts.body).toMatch(/Inter/)
    expect(theme.fonts.mono).toMatch(/DM Mono/)
  })

  it('defines pill (full) and card radii', () => {
    expect(theme.radii.sm).toBe('8px')
    expect(theme.radii.md).toBe('12px')
    expect(theme.radii.lg).toBe('18px')
    expect(theme.radii.pill).toBe('999px')
  })

  it('sets the page background to the warm cream', () => {
    expect(theme.styles.global.body.bg).toBe('bg')
    expect(theme.styles.global.body.color).toBe('ink')
  })
})

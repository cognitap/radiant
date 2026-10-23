import type { CSSProperties } from 'react'
import { buttonTheme } from '../Button.js'
import type { Theme } from './types.js'

export const radiantTheme: CSSProperties = {
  '--color-primary': 'oklch(0.486 0.086 178)',
  '--color-primary-foreground': 'oklch(0.99 0 0)',
  '--color-secondary': 'oklch(0.995 0 0)',
  '--color-secondary-foreground': 'oklch(0.24 0.012 270)',
  '--color-warning': 'oklch(0.8 0.14 78)',
  '--color-warning-foreground': 'oklch(0.3 0.07 55)',
  '--color-destructive': 'oklch(0.56 0.19 25)',
  '--color-destructive-foreground': 'oklch(0.99 0 0)',
  '--color-background': 'oklch(1 0 0)',
  '--color-border': 'oklch(0.89 0.008 270)',
  '--color-foreground': 'oklch(0.24 0.012 270)',
  ...buttonTheme({
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '0.875rem',
    fontSizeSmall: '0.8125rem',
    fontSizeLarge: '0.9375rem',
    fontWeight: 550,
    letterSpacing: '-0.011em',
    height: '2.5rem',
    heightSmall: '2rem',
    heightLarge: '3rem',
    padding: '1rem',
    paddingSmall: '0.75rem',
    paddingLarge: '1.375rem',
    radius: '0.5rem',
    borderWidth: '1px',
    borderStyle: 'solid',
    shadow: '0 1px 2px 0 rgb(0 0 0 / 0.06)',
    shadowPressed: '0 1px 2px 0 rgb(0 0 0 / 0.06)',
    sheen: 0,
    highlight: 0,
    disabledOpacity: 0.5,
    pressScale: 0.97,
    pressDuration: '80ms',
    pressEase: 'var(--ease-snap)',
    releaseDuration: '160ms',
    releaseEase: 'var(--ease-settle)',
    colorDuration: '150ms',
    focusColor: 'oklch(0.55 0.09 178)',
    focusWidth: '2px',
    focusOffset: '2px',
    focusStyle: 'solid'
  })
} as CSSProperties

export const radiant: Theme = { name: 'Radiant', style: radiantTheme }

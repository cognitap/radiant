import type { CSSProperties } from 'react'
import { buttonTheme } from '../Button.js'
import type { Theme } from './types.js'

export const soft: Theme = {
  name: 'Soft squircle',
  style: {
    '--color-primary': 'oklch(0.6 0.21 258)',
    '--color-secondary': 'oklch(0.95 0.04 258)',
    '--color-secondary-foreground': 'oklch(0.45 0.2 258)',
    '--color-destructive': 'oklch(0.6 0.22 25)',
    ...buttonTheme({
      borderWidth: '1px',
      borderStyle: 'solid',
      fontSize: '0.875rem',
      fontSizeSmall: '0.8125rem',
      fontSizeLarge: '0.9375rem',
      focusWidth: '2px',
      height: '2.75rem',
      padding: '1.125rem',
      radius: '1rem',
      radiusPressed: '0.375rem',
      fontFamily: "'Nunito', system-ui, sans-serif",
      cornerShape: 'squircle',
      fontWeight: 800,
      shadow: '0 1px 1px rgb(0 0 0 / 0.12)',
      shadowPressed: '0 1px 1px rgb(0 0 0 / 0.12)',
      sheen: 0.08,
      glow: '55%',
      glowHover: '70%',
      highlight: 0.22,
      pressScale: 0.96,
      focusColor: 'oklch(0.6 0.21 258)',
      focusOffset: '4px',
      pressDuration: '90ms',
      pressEase: 'var(--ease-snap)',
      releaseDuration: '520ms',
      releaseEase: 'var(--ease-spring)'
    })
  } as CSSProperties
}

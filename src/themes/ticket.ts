import type { CSSProperties } from 'react'
import { buttonTheme } from '../Button.js'
import type { Theme } from './types.js'

export const ticket: Theme = {
  name: 'Ticket',
  surface: '#f7ead9',
  style: {
    '--color-primary': 'oklch(0.55 0.19 35)',
    '--color-primary-foreground': 'oklch(0.99 0.01 80)',
    '--color-secondary': 'oklch(0.97 0.03 85)',
    '--color-secondary-foreground': 'oklch(0.35 0.08 50)',
    '--color-warning': 'oklch(0.75 0.14 80)',
    '--color-warning-foreground': 'oklch(0.3 0.07 55)',
    '--color-destructive': 'oklch(0.5 0.18 25)',
    '--color-destructive-foreground': 'oklch(0.99 0 0)',
    '--color-background': 'oklch(0.97 0.03 85)',
    '--color-border': 'oklch(0.35 0.08 50)',
    '--color-foreground': 'oklch(0.35 0.08 50)',
    ...buttonTheme({
      fontSize: '0.875rem',
      fontSizeSmall: '0.8125rem',
      fontSizeLarge: '0.9375rem',
      height: '2.75rem',
      padding: '1.5rem',
      radius: '0.875rem',
      radiusPressed: '0.5rem',
      fontFamily: "'Barlow Condensed', sans-serif",
      textTransform: 'uppercase',
      cornerShape: 'scoop',
      cornerShapePressed: 'round',
      borderWidth: '1.5px',
      borderStyle: 'dashed',
      borderColor: 'oklch(0.35 0.08 50)',
      fontWeight: 600,
      letterSpacing: '0.08em',
      shadow: '0 2px 0 0 oklch(0.35 0.08 50 / 0.4)',
      shadowPressed: '0 0 #0000',
      sheen: 0,
      highlight: 0,
      pressScale: 1,
      pressShift: '2px',
      pressDuration: '100ms',
      pressEase: 'var(--ease-snap)',
      releaseDuration: '200ms',
      releaseEase: 'var(--ease-settle)',
      focusColor: 'oklch(0.55 0.19 35)',
      focusWidth: '2px',
      focusOffset: '4px'
    })
  } as CSSProperties
}

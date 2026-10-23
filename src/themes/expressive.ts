import type { CSSProperties } from 'react'
import { buttonTheme } from '../Button.js'
import type { Theme } from './types.js'

export const expressive: Theme = {
  name: 'Expressive',
  style: {
    '--color-primary': 'oklch(0.52 0.24 290)',
    '--color-secondary': 'oklch(0.91 0.06 290)',
    '--color-secondary-foreground': 'oklch(0.32 0.15 290)',
    '--color-destructive': 'oklch(0.56 0.22 25)',
    '--color-border': 'oklch(0.8 0.06 290)',
    '--color-foreground': 'oklch(0.32 0.15 290)',
    ...buttonTheme({
      borderWidth: '1px',
      borderStyle: 'solid',
      fontSize: '0.875rem',
      fontSizeSmall: '0.8125rem',
      fontSizeLarge: '0.9375rem',
      height: '3rem',
      padding: '1.5rem',
      radius: '1.5rem',
      radiusPressed: '0.75rem',
      fontFamily: "'Poppins', system-ui, sans-serif",
      cornerShape: 'round',
      sheen: 0,
      focusColor: 'oklch(0.52 0.24 290)',
      focusStyle: 'double',
      focusWidth: '6px',
      glow: '0%',
      glowHover: '0%',
      hoverLift: '0px',
      fontWeight: 600,
      letterSpacing: '0',
      shadow: '0 0 #0000',
      shadowPressed: '0 0 #0000',
      highlight: 0,
      pressScale: 0.98,
      pressDuration: '450ms',
      pressEase: 'var(--ease-spring)',
      releaseDuration: '450ms',
      releaseEase: 'var(--ease-spring)'
    })
  } as CSSProperties
}

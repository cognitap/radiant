import type { CSSProperties } from 'react'
import { buttonTheme } from '../Button.js'
import type { Theme } from './types.js'

export const jelly: Theme = {
  name: 'Jelly',
  surface: '#f5f0ff',
  style: {
    '--color-primary': 'oklch(0.65 0.2 15)',
    '--color-primary-foreground': 'oklch(0.99 0 0)',
    '--color-secondary': 'oklch(0.95 0.05 320)',
    '--color-secondary-foreground': 'oklch(0.5 0.18 330)',
    '--color-warning': 'oklch(0.8 0.16 85)',
    '--color-warning-foreground': 'oklch(0.3 0.07 55)',
    '--color-destructive': 'oklch(0.6 0.22 25)',
    '--color-destructive-foreground': 'oklch(0.99 0 0)',
    '--color-background': 'oklch(1 0 0)',
    '--color-border': 'oklch(0.88 0.05 320)',
    '--color-foreground': 'oklch(0.4 0.1 330)',
    ...buttonTheme({
      borderWidth: '1px',
      borderStyle: 'solid',
      fontSize: '0.875rem',
      fontSizeSmall: '0.8125rem',
      fontSizeLarge: '0.9375rem',
      height: '3rem',
      padding: '1.5rem',
      radius: '1.5rem',
      radiusPressed: '1.25rem',
      cornerShape: 'squircle',
      fontFamily: "'Baloo 2', system-ui, sans-serif",
      fontWeight: 700,
      shadow: 'inset 0 -4px 0 0 rgb(0 0 0 / 0.14), 0 12px 24px -10px rgb(0 0 0 / 0.3)',
      shadowPressed: 'inset 0 -2px 0 0 rgb(0 0 0 / 0.14), 0 6px 12px -6px rgb(0 0 0 / 0.3)',
      sheen: 0.12,
      highlight: 0.35,
      pressScale: 0.9,
      pressDuration: '110ms',
      pressEase: 'var(--ease-snap)',
      releaseDuration: '700ms',
      releaseEase: 'var(--ease-spring)',
      focusColor: 'oklch(0.55 0.2 330)',
      focusWidth: '4px',
      focusOffset: '3px'
    })
  } as CSSProperties
}

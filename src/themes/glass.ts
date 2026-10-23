import type { CSSProperties } from 'react'
import { buttonTheme } from '../Button.js'
import type { Theme } from './types.js'

export const glass: Theme = {
  name: 'Glass',
  surface:
    'radial-gradient(40% 80% at 15% 30%, oklch(0.78 0.16 230), transparent 70%), radial-gradient(45% 90% at 55% 80%, oklch(0.74 0.2 330), transparent 70%), radial-gradient(40% 80% at 90% 20%, oklch(0.85 0.14 90), transparent 70%), oklch(0.93 0.03 280)',
  style: {
    '--color-primary': 'oklch(0.55 0.22 265 / 0.78)',
    '--color-secondary': 'rgb(255 255 255 / 0.28)',
    '--color-secondary-foreground': 'oklch(0.2 0.02 280)',
    '--color-destructive': 'oklch(0.6 0.22 25 / 0.8)',
    '--color-background': 'rgb(255 255 255 / 0.12)',
    '--color-border': 'rgb(255 255 255 / 0.6)',
    ...buttonTheme({
      borderWidth: '1px',
      borderStyle: 'solid',
      fontSize: '0.875rem',
      fontSizeSmall: '0.8125rem',
      fontSizeLarge: '0.9375rem',
      focusWidth: '2px',
      height: '2.75rem',
      padding: '1.25rem',
      radius: '1.375rem',
      fontFamily: "'Manrope', system-ui, sans-serif",
      cornerShape: 'squircle',
      focusColor: 'rgb(255 255 255 / 0.95)',
      focusStyle: 'dashed',
      focusOffset: '3px',
      fontWeight: 700,
      shadow: 'inset 0 0 0 1px rgb(255 255 255 / 0.35), 0 10px 30px -10px rgb(30 20 60 / 0.35)',
      shadowPressed:
        'inset 0 0 0 1px rgb(255 255 255 / 0.35), 0 4px 14px -6px rgb(30 20 60 / 0.35)',
      sheen: 0.25,
      highlight: 0.9,
      backdrop: 'blur(18px) saturate(190%)',
      glow: '0%',
      glowHover: '0%',
      pressScale: 0.94,
      pressDuration: '120ms',
      releaseDuration: '600ms',
      releaseEase: 'var(--ease-spring)'
    })
  } as CSSProperties
}

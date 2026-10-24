import type { CSSProperties } from 'react'
import { buttonTheme } from '../Button.js'
import type { Theme } from './types.js'

export const sharp: Theme = {
  name: 'Sharp 3D',
  surface: '#f4f1ea',
  style: {
    '--color-primary': '#ff90e8',
    '--color-primary-foreground': '#111111',
    '--color-secondary': '#ffffff',
    '--color-secondary-foreground': '#111111',
    '--color-warning': '#ffc900',
    '--color-warning-foreground': '#111111',
    '--color-destructive': '#ff5d5d',
    '--color-destructive-foreground': '#111111',
    '--color-background': '#ffffff',
    '--color-border': '#111111',
    '--color-foreground': '#111111',
    ...buttonTheme({
      borderStyle: 'solid',
      fontSize: '0.875rem',
      fontSizeSmall: '0.8125rem',
      fontSizeLarge: '0.9375rem',
      height: '2.75rem',
      padding: '1.25rem',
      radius: '0px',
      radiusPressed: '0px',
      cornerShape: 'round',
      fontFamily: "'Archivo Black', sans-serif",
      textTransform: 'uppercase',
      fontWeight: 400,
      letterSpacing: '0.02em',
      borderWidth: '2px',
      borderColor: '#111111',
      shadow: '4px 4px 0 0 #111111',
      shadowPressed: '1px 1px 0 0 #111111',
      ghostShadow: '4px 4px 0 0 #111111',
      focusColor: '#111111',
      focusWidth: '2px',
      focusOffset: '0px',
      ghostShadowPressed: '1px 1px 0 0 #111111',
      sheen: 0,
      highlight: 0,
      glow: '0%',
      pressScale: 1,
      pressShift: '3px',
      pressShiftX: '3px',
      pressDuration: '60ms',
      pressEase: 'var(--ease-snap)',
      releaseDuration: '120ms',
      releaseEase: 'var(--ease-settle)'
    })
  } as CSSProperties
}

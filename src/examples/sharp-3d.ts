import { defineTheme, type ThemeDefinition } from '../themes/defineTheme.js'
import { snap, settle } from './preset-values.js'

export const sharpDefinition: ThemeDefinition = {
  id: 'sharp-3d',
  name: 'Sharp 3D',
  tokens: {
    color: {
      surface: '#ffffff',
      foreground: '#111111',
      mutedForeground: '#53504a',
      border: '#111111',
      accent: '#ff90e8',
      accentForeground: '#111111',
      neutral: '#ffffff',
      neutralForeground: '#111111',
      warning: '#ffc900',
      warningForeground: '#111111',
      danger: '#ff5d5d',
      dangerForeground: '#111111',
      focus: '#111111',
      placeholder: '#53504a',
      disabledBackground: '#ffffff',
      disabledBorder: '#111111',
      invalid: '#b52929'
    },
    typography: {
      family: 'system-ui, sans-serif',
      bodySize: '1rem',
      smallSize: '0.875rem',
      headingSize: '1.25rem',
      bodyWeight: 400,
      labelWeight: 600,
      headingWeight: 700,
      letterSpacing: '0'
    },
    control: {
      small: {
        height: '2rem',
        paddingInline: '0.75rem',
        fontSize: '0.8125rem',
        indicatorSize: '1rem'
      },
      medium: {
        height: '2.75rem',
        paddingInline: '1.25rem',
        fontSize: '0.875rem',
        indicatorSize: '1.125rem'
      },
      large: {
        height: '3.25rem',
        paddingInline: '1.5rem',
        fontSize: '0.9375rem',
        indicatorSize: '1.25rem'
      },
      radius: '0px',
      cornerShape: 'round',
      borderWidth: '2px',
      borderStyle: 'solid'
    },
    surface: {
      canvas: '#f4f1ea',
      radius: '0px',
      cornerShape: 'round',
      borderWidth: '2px',
      borderStyle: 'solid',
      padding: '1.5rem',
      gap: '1rem',
      shadow: '4px 4px 0 var(--rad-color-border)',
      overlayShadow: '0 20px 60px rgb(0 0 0 / 0.22)',
      backdrop: 'rgb(15 12 25 / 0.45)'
    },
    focus: {
      width: '2px',
      offset: '0px',
      style: 'solid'
    },
    motion: {
      pressDuration: '60ms',
      pressEase: snap,
      releaseDuration: '120ms',
      releaseEase: settle,
      colorDuration: '150ms',
      disclosureDuration: '180ms'
    },
    state: { disabledOpacity: 0.5 }
  },
  components: {
    button: {
      borderColor: 'var(--rad-color-border)',
      radiusPressed: '0px',
      textTransform: 'uppercase',
      fontWeight: 400,
      letterSpacing: '0.02em',
      shadow: '4px 4px 0 0 var(--rad-color-border)',
      shadowPressed: '1px 1px 0 0 var(--rad-color-border)',
      ghostShadow: '4px 4px 0 0 var(--rad-color-border)',
      ghostShadowPressed: '1px 1px 0 0 var(--rad-color-border)',
      sheen: 0,
      highlight: 0,
      glow: '0%',
      pressScale: 1,
      pressShift: '3px',
      pressShiftX: '3px',
      fontFamily: "'Archivo Black', system-ui, sans-serif"
    }
  },
  modes: {
    light: {
      components: { link: { hoverColor: 'var(--rad-color-foreground)' } }
    },
    dark: {
      tokens: {
        color: {
          surface: '#27242a',
          foreground: '#fff8ef',
          mutedForeground: '#c5bcb3',
          border: '#fff8ef',
          accent: '#ff90e8',
          accentForeground: '#111111',
          neutral: '#3b3540',
          neutralForeground: '#fff8ef',
          warning: '#ffc900',
          warningForeground: '#111111',
          danger: '#ff8585',
          dangerForeground: '#111111',
          focus: '#fff8ef',
          placeholder: '#c5bcb3',
          disabledBackground: '#3b3540',
          disabledBorder: '#fff8ef',
          invalid: '#ff8585'
        },
        surface: {
          canvas: '#171419',
          shadow: '4px 4px 0 var(--rad-color-border)',
          overlayShadow: '0 20px 60px rgb(0 0 0 / 0.65)',
          backdrop: 'rgb(0 0 0 / 0.65)'
        }
      }
    }
  }
}

export const sharp = defineTheme(sharpDefinition)

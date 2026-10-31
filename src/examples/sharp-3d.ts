import { defineTheme, type ThemeDefinition } from '../themes/defineTheme.js'
import { snap, settle } from './preset-values.js'

// Neo-brutalism: square ink outlines and one hard offset shadow for everything that is raised.
const offset = (size: number) => `${size}px ${size}px 0 0 var(--rad-color-border)`

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
      borderStyle: 'solid',
      action: {
        fontFamily: "'Archivo Black', system-ui, sans-serif",
        fontWeight: 400,
        textTransform: 'uppercase',
        letterSpacing: '0.02em',
        borderColor: 'var(--rad-color-border)',
        shadow: offset(4),
        shadowPressed: offset(1),
        highlight: 0,
        sheen: 0,
        radiusPressed: '0px'
      },
      field: {
        background: 'var(--rad-color-surface)',
        borderColor: 'var(--rad-color-border)',
        shadow: offset(4),
        backdropFilter: 'none'
      },
      indicator: { shadow: offset(2), checkedShadow: offset(2), thumbShadow: offset(2) },
      track: { background: 'var(--rad-color-surface)', borderWidth: '2px', shadow: offset(2) },
      selected: {
        background: 'var(--rad-color-accent)',
        foreground: 'var(--rad-color-accent-foreground)',
        borderColor: 'var(--rad-color-border)',
        shadow: offset(2)
      },
      item: {
        highlightBackground: 'var(--rad-color-accent)',
        highlightForeground: 'var(--rad-color-accent-foreground)'
      }
    },
    surface: {
      canvas: '#f4f1ea',
      radius: '0px',
      cornerShape: 'round',
      borderWidth: '2px',
      borderStyle: 'solid',
      padding: '1.5rem',
      gap: '1rem',
      shadow: offset(6),
      overlayShadow: offset(8),
      overlayBackground: 'var(--rad-color-surface)',
      backdrop: 'rgb(244 241 234 / 0.7)',
      backdropFilter: 'none'
    },
    focus: {
      width: '2px',
      offset: '3px',
      style: 'solid'
    },
    motion: {
      pressDuration: '60ms',
      pressEase: snap,
      releaseDuration: '120ms',
      releaseEase: settle,
      colorDuration: '150ms',
      disclosureDuration: '180ms',
      pressScale: 1,
      pressShiftX: '3px',
      pressShiftY: '3px'
    },
    state: { disabledOpacity: 0.5 }
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
          backdrop: 'rgb(23 20 25 / 0.75)'
        }
      }
    }
  }
}

export const sharp = defineTheme(sharpDefinition)

import { defineTheme, type ThemeDefinition } from '../themes/defineTheme.js'
import { snap, spring } from './preset-values.js'

// Soft UI: borderless filled wells, diffuse shadows and raised white pills on a tinted track.
const ink = (alpha: number) => `rgb(30 50 110 / ${alpha})`

export const softDefinition: ThemeDefinition = {
  id: 'soft-squircle',
  name: 'Soft squircle',
  tokens: {
    color: {
      surface: '#ffffff',
      foreground: '#24314d',
      mutedForeground: '#5c6880',
      border: '#c5cfe6',
      accent: '#2858c9',
      accentForeground: '#ffffff',
      neutral: '#eaf0ff',
      neutralForeground: '#234581',
      warning: '#efc355',
      warningForeground: '#44300c',
      danger: '#b52c34',
      dangerForeground: '#ffffff',
      focus: '#2858c9',
      placeholder: '#5c6880',
      disabledBackground: '#eaf0ff',
      disabledBorder: '#c5cfe6',
      invalid: '#b52c34'
    },
    typography: {
      family: "'Nunito', system-ui, sans-serif",
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
        paddingInline: '1.125rem',
        fontSize: '0.875rem',
        indicatorSize: '1.125rem'
      },
      large: {
        height: '3.25rem',
        paddingInline: '1.5rem',
        fontSize: '0.9375rem',
        indicatorSize: '1.25rem'
      },
      radius: '1rem',
      cornerShape: 'squircle',
      borderWidth: '1px',
      borderStyle: 'solid',
      action: {
        fontWeight: 800,
        shadow: `0 1px 2px ${ink(0.12)}, 0 4px 12px -6px ${ink(0.3)}`,
        shadowPressed: `0 1px 1px ${ink(0.12)}`,
        highlight: 0.22,
        sheen: 0.08,
        radiusPressed: '0.625rem'
      },
      field: {
        background: 'var(--rad-color-neutral)',
        borderColor: 'transparent',
        shadow: 'none',
        backdropFilter: 'none'
      },
      indicator: {
        shadow: `inset 0 1px 2px ${ink(0.12)}`,
        checkedShadow: `0 2px 6px -2px ${ink(0.45)}`,
        thumbShadow: `0 2px 6px ${ink(0.3)}, 0 0 0 0.5px ${ink(0.08)}`
      },
      track: { background: 'var(--rad-color-neutral)', borderWidth: '0px', shadow: 'none' },
      selected: {
        background: 'var(--rad-color-surface)',
        foreground: 'var(--rad-color-foreground)',
        borderColor: 'transparent',
        shadow: `0 2px 8px -2px ${ink(0.28)}, 0 0 0 0.5px ${ink(0.08)}`
      },
      item: {
        highlightBackground: 'var(--rad-color-neutral)',
        highlightForeground: 'var(--rad-color-neutral-foreground)'
      }
    },
    surface: {
      canvas: '#f3f6ff',
      radius: '1.5rem',
      cornerShape: 'squircle',
      borderWidth: '0px',
      borderStyle: 'solid',
      padding: '1.5rem',
      gap: '1rem',
      shadow: `0 1px 2px ${ink(0.06)}, 0 12px 32px -16px ${ink(0.3)}`,
      overlayShadow: `0 1px 3px ${ink(0.08)}, 0 24px 64px -20px ${ink(0.45)}`,
      overlayBackground: 'var(--rad-color-surface)',
      backdrop: 'rgb(16 24 42 / 0.35)',
      backdropFilter: 'none'
    },
    focus: {
      width: '2px',
      offset: '4px',
      style: 'solid'
    },
    motion: {
      pressDuration: '90ms',
      pressEase: snap,
      releaseDuration: '520ms',
      releaseEase: spring,
      colorDuration: '150ms',
      disclosureDuration: '240ms',
      pressScale: 0.96
    },
    state: { disabledOpacity: 0.5 }
  },
  components: { button: { glow: '55%' } },
  modes: {
    dark: {
      tokens: {
        color: {
          surface: '#1a2237',
          foreground: '#edf2ff',
          mutedForeground: '#b2c2e5',
          border: '#596d9b',
          accent: '#9cbaff',
          accentForeground: '#142e68',
          neutral: '#2c3b5f',
          neutralForeground: '#e3ebff',
          warning: '#efc355',
          warningForeground: '#352507',
          danger: '#ff9298',
          dangerForeground: '#3c111a',
          focus: '#a9c4ff',
          placeholder: '#b2c2e5',
          disabledBackground: '#2c3b5f',
          disabledBorder: '#596d9b',
          invalid: '#ff9298'
        },
        surface: {
          canvas: '#10182a',
          shadow: '0 1px 2px rgb(0 0 0 / 0.3), 0 12px 32px -16px rgb(0 0 0 / 0.7)',
          overlayShadow: '0 1px 3px rgb(0 0 0 / 0.4), 0 24px 64px -20px rgb(0 0 0 / 0.8)',
          backdrop: 'rgb(0 0 0 / 0.6)'
        }
      }
    }
  }
}

export const soft = defineTheme(softDefinition)

import { defineTheme, type ThemeDefinition } from '../themes/defineTheme.js'
import { snap, spring } from './preset-values.js'

export const jellyDefinition: ThemeDefinition = {
  id: 'jelly',
  name: 'Jelly',
  tokens: {
    color: {
      surface: '#ffffff',
      foreground: '#653458',
      mutedForeground: '#805d7b',
      border: '#d4bedb',
      accent: '#b63251',
      accentForeground: '#ffffff',
      neutral: '#f4e6f7',
      neutralForeground: '#6f2865',
      warning: '#efc355',
      warningForeground: '#44300c',
      danger: '#b52c34',
      dangerForeground: '#ffffff',
      focus: '#932a81',
      placeholder: '#805d7b',
      disabledBackground: '#f4e6f7',
      disabledBorder: '#d4bedb',
      invalid: '#b52c34'
    },
    typography: {
      family: "'Baloo 2', system-ui, sans-serif",
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
        height: '3rem',
        paddingInline: '1.5rem',
        fontSize: '0.875rem',
        indicatorSize: '1.125rem'
      },
      large: {
        height: '3.25rem',
        paddingInline: '1.5rem',
        fontSize: '0.9375rem',
        indicatorSize: '1.25rem'
      },
      radius: '1.5rem',
      cornerShape: 'squircle',
      borderWidth: '1px',
      borderStyle: 'solid'
    },
    surface: {
      canvas: '#f5f0ff',
      radius: '1.5rem',
      cornerShape: 'squircle',
      borderWidth: '1px',
      borderStyle: 'solid',
      padding: '1.5rem',
      gap: '1rem',
      shadow: '0 1px 3px rgb(0 0 0 / 0.08)',
      overlayShadow: '0 20px 60px rgb(0 0 0 / 0.22)',
      backdrop: 'rgb(15 12 25 / 0.45)'
    },
    focus: {
      width: '4px',
      offset: '3px',
      style: 'solid'
    },
    motion: {
      pressDuration: '110ms',
      pressEase: snap,
      releaseDuration: '700ms',
      releaseEase: spring,
      colorDuration: '150ms',
      disclosureDuration: '180ms'
    },
    state: { disabledOpacity: 0.5 }
  },
  components: {
    button: {
      radiusPressed: '1.25rem',
      fontWeight: 700,
      shadow: 'inset 0 -4px 0 0 rgb(0 0 0 / 0.14), 0 12px 24px -10px rgb(0 0 0 / 0.3)',
      shadowPressed: 'inset 0 -2px 0 0 rgb(0 0 0 / 0.14), 0 6px 12px -6px rgb(0 0 0 / 0.3)',
      sheen: 0.12,
      highlight: 0.35,
      pressScale: 0.9
    }
  },
  modes: {
    dark: {
      tokens: {
        color: {
          surface: '#2a1c30',
          foreground: '#ffebfb',
          mutedForeground: '#d0b0ce',
          border: '#8c658e',
          accent: '#ffa0b4',
          accentForeground: '#4b1127',
          neutral: '#4a2d50',
          neutralForeground: '#ffe6fc',
          warning: '#efc355',
          warningForeground: '#352507',
          danger: '#ff9298',
          dangerForeground: '#3c111a',
          focus: '#f2a6e6',
          placeholder: '#d0b0ce',
          disabledBackground: '#4a2d50',
          disabledBorder: '#8c658e',
          invalid: '#ff9298'
        },
        surface: {
          canvas: '#1a111e',
          shadow: '0 1px 4px rgb(0 0 0 / 0.4)',
          overlayShadow: '0 20px 60px rgb(0 0 0 / 0.65)',
          backdrop: 'rgb(0 0 0 / 0.65)'
        }
      }
    }
  }
}

export const jelly = defineTheme(jellyDefinition)

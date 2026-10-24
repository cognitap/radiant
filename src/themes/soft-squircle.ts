import { defineTheme } from './defineTheme.js'
import { snap, spring } from './preset-values.js'

export const soft = defineTheme({
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
      borderStyle: 'solid'
    },
    surface: {
      canvas: '#f3f6ff',
      radius: '1rem',
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
      disclosureDuration: '180ms'
    },
    state: { disabledOpacity: 0.5 }
  },
  components: {
    button: {
      radiusPressed: '0.375rem',
      fontWeight: 800,
      shadow: '0 1px 1px rgb(0 0 0 / 0.12)',
      shadowPressed: '0 1px 1px rgb(0 0 0 / 0.12)',
      sheen: 0.08,
      glow: '55%',
      highlight: 0.22,
      pressScale: 0.96
    }
  },
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
          shadow: '0 1px 4px rgb(0 0 0 / 0.4)',
          overlayShadow: '0 20px 60px rgb(0 0 0 / 0.65)',
          backdrop: 'rgb(0 0 0 / 0.65)'
        }
      }
    }
  }
})

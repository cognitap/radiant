import { defineTheme } from './defineTheme.js'
import { snap, settle } from './preset-values.js'

export const radiant = defineTheme({
  id: 'radiant',
  name: 'Radiant',
  tokens: {
    color: {
      surface: '#ffffff',
      foreground: '#292a31',
      mutedForeground: '#60636e',
      border: '#d6d8df',
      accent: '#176e5e',
      accentForeground: '#ffffff',
      neutral: '#f0f3f2',
      neutralForeground: '#293b36',
      warning: '#efc355',
      warningForeground: '#44300c',
      danger: '#b52c34',
      dangerForeground: '#ffffff',
      focus: '#247b69',
      placeholder: '#60636e',
      disabledBackground: '#f0f3f2',
      disabledBorder: '#d6d8df',
      invalid: '#b52c34'
    },
    typography: {
      family: "'Inter', system-ui, sans-serif",
      bodySize: '1rem',
      smallSize: '0.875rem',
      headingSize: '1.25rem',
      bodyWeight: 400,
      labelWeight: 600,
      headingWeight: 700,
      letterSpacing: '-0.011em'
    },
    control: {
      small: {
        height: '2rem',
        paddingInline: '0.75rem',
        fontSize: '0.8125rem',
        indicatorSize: '1rem'
      },
      medium: {
        height: '2.5rem',
        paddingInline: '1rem',
        fontSize: '0.875rem',
        indicatorSize: '1.125rem'
      },
      large: {
        height: '3rem',
        paddingInline: '1.375rem',
        fontSize: '0.9375rem',
        indicatorSize: '1.25rem'
      },
      radius: '0.5rem',
      cornerShape: 'round',
      borderWidth: '1px',
      borderStyle: 'solid'
    },
    surface: {
      canvas: '#f7faf9',
      radius: '0.5rem',
      cornerShape: 'round',
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
      offset: '2px',
      style: 'solid'
    },
    motion: {
      pressDuration: '80ms',
      pressEase: snap,
      releaseDuration: '160ms',
      releaseEase: settle,
      colorDuration: '150ms',
      disclosureDuration: '180ms'
    },
    state: { disabledOpacity: 0.5 }
  },
  components: {
    button: {
      fontWeight: 550,
      shadow: '0 1px 2px 0 rgb(0 0 0 / 0.06)',
      shadowPressed: '0 1px 2px 0 rgb(0 0 0 / 0.06)',
      sheen: 0,
      highlight: 0,
      pressScale: 0.97
    }
  },
  modes: {
    dark: {
      tokens: {
        color: {
          surface: '#1a2322',
          foreground: '#edf5f2',
          mutedForeground: '#b0c1ba',
          border: '#536760',
          accent: '#78d8be',
          accentForeground: '#102d25',
          neutral: '#2a3e37',
          neutralForeground: '#e1f3eb',
          warning: '#efc355',
          warningForeground: '#352507',
          danger: '#ff9298',
          dangerForeground: '#3c111a',
          focus: '#85e0c6',
          placeholder: '#b0c1ba',
          disabledBackground: '#2a3e37',
          disabledBorder: '#536760',
          invalid: '#ff9298'
        },
        surface: {
          canvas: '#101917',
          shadow: '0 1px 4px rgb(0 0 0 / 0.4)',
          overlayShadow: '0 20px 60px rgb(0 0 0 / 0.65)',
          backdrop: 'rgb(0 0 0 / 0.65)'
        }
      }
    }
  }
})

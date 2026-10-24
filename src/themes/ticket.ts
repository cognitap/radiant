import { defineTheme } from './defineTheme.js'
import { snap, settle } from './preset-values.js'

export const ticket = defineTheme({
  id: 'ticket',
  name: 'Ticket',
  tokens: {
    color: {
      surface: '#fff2dc',
      foreground: '#583a27',
      mutedForeground: '#795f46',
      border: '#765036',
      accent: '#a43e19',
      accentForeground: '#fff8eb',
      neutral: '#f4e2c4',
      neutralForeground: '#583a27',
      warning: '#e6b74c',
      warningForeground: '#44300c',
      danger: '#a52b2f',
      dangerForeground: '#ffffff',
      focus: '#a43e19',
      placeholder: '#795f46',
      disabledBackground: '#f4e2c4',
      disabledBorder: '#765036',
      invalid: '#a52b2f'
    },
    typography: {
      family: "'Barlow Condensed', system-ui, sans-serif",
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
      radius: '0.875rem',
      cornerShape: 'scoop',
      borderWidth: '1.5px',
      borderStyle: 'dashed'
    },
    surface: {
      canvas: '#f7ead9',
      radius: '0.875rem',
      cornerShape: 'scoop',
      borderWidth: '1.5px',
      borderStyle: 'dashed',
      padding: '1.5rem',
      gap: '1rem',
      shadow: '0 2px 0 color-mix(in oklab, var(--rad-color-border) 40%, transparent)',
      overlayShadow: '0 20px 60px rgb(0 0 0 / 0.22)',
      backdrop: 'rgb(15 12 25 / 0.45)'
    },
    focus: {
      width: '2px',
      offset: '4px',
      style: 'solid'
    },
    motion: {
      pressDuration: '100ms',
      pressEase: snap,
      releaseDuration: '200ms',
      releaseEase: settle,
      colorDuration: '150ms',
      disclosureDuration: '180ms'
    },
    state: { disabledOpacity: 0.5 }
  },
  components: {
    button: {
      radiusPressed: '0.5rem',
      textTransform: 'uppercase',
      cornerShapePressed: 'round',
      fontWeight: 600,
      letterSpacing: '0.08em',
      shadow: '0 2px 0 0 color-mix(in oklab, var(--rad-color-border) 40%, transparent)',
      shadowPressed: '0 0 #0000',
      sheen: 0,
      highlight: 0,
      pressScale: 1,
      pressShift: '2px'
    }
  },
  modes: {
    dark: {
      tokens: {
        color: {
          surface: '#30261e',
          foreground: '#fff0d5',
          mutedForeground: '#d0b697',
          border: '#b4946c',
          accent: '#ffb18c',
          accentForeground: '#49200f',
          neutral: '#493726',
          neutralForeground: '#ffedce',
          warning: '#efc355',
          warningForeground: '#352507',
          danger: '#ff9298',
          dangerForeground: '#3c111a',
          focus: '#ffc09f',
          placeholder: '#d0b697',
          disabledBackground: '#493726',
          disabledBorder: '#b4946c',
          invalid: '#ff9298'
        },
        surface: {
          canvas: '#1d1712',
          shadow: '0 2px 0 color-mix(in oklab, var(--rad-color-border) 40%, transparent)',
          overlayShadow: '0 20px 60px rgb(0 0 0 / 0.65)',
          backdrop: 'rgb(0 0 0 / 0.65)'
        }
      }
    }
  }
})

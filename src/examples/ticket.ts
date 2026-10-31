import { defineTheme, type ThemeDefinition } from '../themes/defineTheme.js'
import { snap, settle } from './preset-values.js'

// Printed stub: inked notched controls, scooped dashed tickets, flat stamps and inverted ink for selection.
const stamp = 'color-mix(in oklab, var(--rad-color-border) 40%, transparent)'

export const ticketDefinition: ThemeDefinition = {
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
      radius: '0.375rem',
      cornerShape: 'notch',
      borderWidth: '2px',
      borderStyle: 'solid',
      action: {
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        shadow: `0 2px 0 0 ${stamp}`,
        shadowPressed: 'none',
        highlight: 0,
        sheen: 0,
        radiusPressed: '0.5rem',
        cornerShapePressed: 'round'
      },
      field: {
        background: 'var(--rad-color-surface)',
        borderColor: 'var(--rad-color-foreground)',
        shadow: 'none',
        backdropFilter: 'none'
      },
      indicator: { shadow: 'none', checkedShadow: 'none', thumbShadow: 'none' },
      track: { background: 'transparent', borderWidth: '1.5px', shadow: 'none' },
      selected: {
        background: 'var(--rad-color-foreground)',
        foreground: 'var(--rad-color-surface)',
        borderColor: 'var(--rad-color-foreground)',
        shadow: 'none'
      },
      item: {
        highlightBackground: 'var(--rad-color-foreground)',
        highlightForeground: 'var(--rad-color-surface)'
      }
    },
    surface: {
      canvas: '#f7ead9',
      radius: '0.875rem',
      cornerShape: 'scoop',
      borderWidth: '1.5px',
      borderStyle: 'dashed',
      padding: '1.5rem',
      gap: '1rem',
      shadow: `0 2px 0 ${stamp}`,
      overlayShadow: `0 3px 0 ${stamp}, 0 20px 40px -20px rgb(60 30 10 / 0.35)`,
      overlayBackground: 'var(--rad-color-surface)',
      backdrop: 'rgb(60 40 20 / 0.4)',
      backdropFilter: 'none'
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
      disclosureDuration: '180ms',
      pressScale: 1,
      pressShiftY: '2px'
    },
    state: { disabledOpacity: 0.5 }
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
          overlayShadow: `0 3px 0 ${stamp}, 0 20px 40px -20px rgb(0 0 0 / 0.7)`,
          backdrop: 'rgb(0 0 0 / 0.65)'
        }
      }
    }
  }
}

export const ticket = defineTheme(ticketDefinition)

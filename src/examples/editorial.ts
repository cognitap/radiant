import { defineTheme, type ThemeDefinition } from '../themes/defineTheme.js'
import { settle } from './preset-values.js'

// Magazine: serif type on warm paper, hairline rules, no shadows, and an underline for whatever is chosen.
const rule = 'inset 0 -2px 0 0 var(--rad-color-accent)'

export const editorialDefinition: ThemeDefinition = {
  id: 'editorial',
  name: 'Editorial',
  tokens: {
    color: {
      surface: '#fffdf8',
      foreground: '#1c1915',
      mutedForeground: '#5c554a',
      border: '#d8d0c2',
      accent: '#9b1c1c',
      accentForeground: '#fffdf8',
      neutral: '#f2ede3',
      neutralForeground: '#1c1915',
      warning: '#e8b64c',
      warningForeground: '#2e2205',
      danger: '#9b1c1c',
      dangerForeground: '#fffdf8',
      focus: '#1c1915',
      placeholder: '#6b6357',
      disabledBackground: '#f2ede3',
      disabledBorder: '#d8d0c2',
      invalid: '#9b1c1c'
    },
    typography: {
      family: "'Source Serif 4', Georgia, serif",
      bodySize: '1.0625rem',
      smallSize: '0.9375rem',
      headingSize: '1.375rem',
      bodyWeight: 400,
      labelWeight: 600,
      headingWeight: 600,
      letterSpacing: '0'
    },
    control: {
      small: {
        height: '2rem',
        paddingInline: '0.75rem',
        fontSize: '0.875rem',
        indicatorSize: '1rem'
      },
      medium: {
        height: '2.5rem',
        paddingInline: '1rem',
        fontSize: '0.9375rem',
        indicatorSize: '1.125rem'
      },
      large: {
        height: '3rem',
        paddingInline: '1.25rem',
        fontSize: '1rem',
        indicatorSize: '1.25rem'
      },
      radius: '0px',
      cornerShape: 'round',
      borderWidth: '1px',
      borderStyle: 'solid',
      action: {
        fontFamily: "'Source Serif 4', Georgia, serif",
        fontWeight: 600,
        letterSpacing: '0.01em',
        shadow: 'none',
        shadowPressed: 'none',
        highlight: 0,
        sheen: 0
      },
      field: {
        background: 'transparent',
        borderColor:
          'color-mix(in oklab, var(--rad-color-foreground) 45%, var(--rad-color-border))',
        shadow: 'none',
        backdropFilter: 'none'
      },
      indicator: { shadow: 'none', checkedShadow: 'none', thumbShadow: 'none' },
      track: { background: 'var(--rad-color-neutral)', borderWidth: '0px', shadow: 'none' },
      selected: {
        background: 'transparent',
        foreground: 'var(--rad-color-foreground)',
        borderColor: 'transparent',
        shadow: rule
      },
      item: {
        highlightBackground: 'var(--rad-color-neutral)',
        highlightForeground: 'var(--rad-color-accent)'
      }
    },
    surface: {
      canvas: '#f7f3ea',
      radius: '0px',
      cornerShape: 'round',
      borderWidth: '1px',
      borderStyle: 'solid',
      padding: '1.75rem',
      gap: '1rem',
      shadow: 'none',
      overlayShadow: '0 1px 0 var(--rad-color-border), 0 16px 40px -24px rgb(28 25 21 / 0.35)',
      overlayBackground: 'var(--rad-color-surface)',
      backdrop: 'rgb(247 243 234 / 0.8)',
      backdropFilter: 'none'
    },
    focus: {
      width: '1px',
      offset: '3px',
      style: 'solid'
    },
    motion: {
      pressDuration: '80ms',
      pressEase: settle,
      releaseDuration: '200ms',
      releaseEase: settle,
      colorDuration: '200ms',
      disclosureDuration: '260ms',
      pressScale: 1,
      pressShiftY: '1px'
    },
    state: { disabledOpacity: 0.45 }
  },
  modes: {
    dark: {
      tokens: {
        color: {
          surface: '#1d1a16',
          foreground: '#f1ece2',
          mutedForeground: '#b9b0a2',
          border: '#423b31',
          accent: '#f0897c',
          accentForeground: '#1d1a16',
          neutral: '#2a261f',
          neutralForeground: '#f1ece2',
          warning: '#e8b64c',
          warningForeground: '#2e2205',
          danger: '#f0897c',
          dangerForeground: '#1d1a16',
          focus: '#f1ece2',
          placeholder: '#a39a8c',
          disabledBackground: '#2a261f',
          disabledBorder: '#423b31',
          invalid: '#f0897c'
        },
        surface: {
          canvas: '#14120f',
          overlayShadow: '0 1px 0 var(--rad-color-border), 0 16px 40px -24px rgb(0 0 0 / 0.8)',
          backdrop: 'rgb(20 18 15 / 0.8)'
        }
      }
    }
  }
}

export const editorial = defineTheme(editorialDefinition)

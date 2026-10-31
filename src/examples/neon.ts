import { defineTheme, type ThemeDefinition } from '../themes/defineTheme.js'
import { snap, settle } from './preset-values.js'

// Sci-fi HUD: bevelled cut corners, monospace readouts and light that glows instead of casting shadows.
const glow = (alpha: number) =>
  `color-mix(in oklab, var(--rad-color-accent) ${alpha}%, transparent)`

export const neonDefinition: ThemeDefinition = {
  id: 'neon',
  name: 'Neon',
  tokens: {
    color: {
      surface: '#ffffff',
      foreground: '#0b1a24',
      mutedForeground: '#3f5866',
      border: '#7c98a6',
      accent: '#006b96',
      accentForeground: '#ffffff',
      neutral: '#e4eef3',
      neutralForeground: '#0b1a24',
      warning: '#f2c230',
      warningForeground: '#2a1d00',
      danger: '#c2185b',
      dangerForeground: '#ffffff',
      focus: '#c2008a',
      placeholder: '#4d6573',
      disabledBackground: '#eef3f6',
      disabledBorder: '#a9bcc6',
      invalid: '#c2185b'
    },
    typography: {
      family: "'IBM Plex Mono', ui-monospace, monospace",
      bodySize: '0.9375rem',
      smallSize: '0.8125rem',
      headingSize: '1.125rem',
      bodyWeight: 400,
      labelWeight: 600,
      headingWeight: 700,
      letterSpacing: '-0.01em'
    },
    control: {
      small: {
        height: '2rem',
        paddingInline: '0.75rem',
        fontSize: '0.75rem',
        indicatorSize: '1rem'
      },
      medium: {
        height: '2.5rem',
        paddingInline: '1.125rem',
        fontSize: '0.8125rem',
        indicatorSize: '1.125rem'
      },
      large: {
        height: '3rem',
        paddingInline: '1.375rem',
        fontSize: '0.875rem',
        indicatorSize: '1.25rem'
      },
      radius: '0.5rem',
      cornerShape: 'bevel',
      borderWidth: '1px',
      borderStyle: 'solid',
      action: {
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        shadow: `0 0 0 1px ${glow(35)}, 0 0 18px -4px ${glow(65)}`,
        shadowPressed: `0 0 0 1px ${glow(60)}, 0 0 26px 0 ${glow(85)}`,
        highlight: 0,
        sheen: 0
      },
      field: {
        background: 'color-mix(in oklab, var(--rad-color-accent) 4%, var(--rad-color-surface))',
        borderColor: 'color-mix(in oklab, var(--rad-color-accent) 55%, var(--rad-color-border))',
        shadow: `inset 0 0 14px -6px ${glow(55)}`,
        backdropFilter: 'none'
      },
      indicator: {
        shadow: `0 0 8px -2px ${glow(50)}`,
        checkedShadow: `0 0 12px 0 ${glow(80)}`,
        thumbShadow: `0 0 12px 0 ${glow(80)}`
      },
      track: {
        background: 'color-mix(in oklab, var(--rad-color-accent) 10%, var(--rad-color-surface))',
        borderWidth: '1px',
        shadow: `inset 0 0 8px -4px ${glow(70)}`
      },
      selected: {
        background: 'color-mix(in oklab, var(--rad-color-accent) 10%, var(--rad-color-surface))',
        foreground: 'var(--rad-color-accent)',
        borderColor: 'var(--rad-color-accent)',
        shadow: `0 0 16px -2px ${glow(70)}, inset 0 0 10px -4px ${glow(70)}`
      },
      item: {
        highlightBackground:
          'color-mix(in oklab, var(--rad-color-accent) 16%, var(--rad-color-surface))',
        highlightForeground: 'var(--rad-color-foreground)'
      }
    },
    surface: {
      canvas:
        'linear-gradient(color-mix(in oklab, var(--rad-color-accent) 7%, transparent) 1px, transparent 1px) 0 0 / 24px 24px, linear-gradient(90deg, color-mix(in oklab, var(--rad-color-accent) 7%, transparent) 1px, transparent 1px) 0 0 / 24px 24px, #f1f6f9',
      radius: '0.875rem',
      cornerShape: 'bevel',
      borderWidth: '1px',
      borderStyle: 'solid',
      padding: '1.5rem',
      gap: '1rem',
      shadow: `0 0 0 1px ${glow(20)}, 0 0 32px -14px ${glow(55)}`,
      overlayShadow: `0 0 0 1px ${glow(45)}, 0 0 48px -10px ${glow(70)}`,
      overlayBackground: 'var(--rad-color-surface)',
      backdrop: 'rgb(4 12 18 / 0.55)',
      backdropFilter: 'none'
    },
    focus: {
      width: '2px',
      offset: '3px',
      style: 'dotted'
    },
    motion: {
      pressDuration: '50ms',
      pressEase: snap,
      releaseDuration: '140ms',
      releaseEase: settle,
      colorDuration: '90ms',
      disclosureDuration: '140ms',
      pressScale: 0.98
    },
    state: { disabledOpacity: 0.45 }
  },
  modes: {
    dark: {
      tokens: {
        color: {
          surface: '#0a121b',
          foreground: '#d8f7ff',
          mutedForeground: '#8fb3c2',
          border: '#24506a',
          accent: '#00e5ff',
          accentForeground: '#00141a',
          neutral: '#102330',
          neutralForeground: '#d8f7ff',
          warning: '#ffd23f',
          warningForeground: '#1f1600',
          danger: '#ff4f9a',
          dangerForeground: '#1a0010',
          focus: '#ff4fd8',
          placeholder: '#7fa3b2',
          disabledBackground: '#0f1c26',
          disabledBorder: '#24506a',
          invalid: '#ff4f9a'
        },
        surface: {
          canvas:
            'linear-gradient(color-mix(in oklab, var(--rad-color-accent) 6%, transparent) 1px, transparent 1px) 0 0 / 24px 24px, linear-gradient(90deg, color-mix(in oklab, var(--rad-color-accent) 6%, transparent) 1px, transparent 1px) 0 0 / 24px 24px, #04080d',
          backdrop: 'rgb(0 4 8 / 0.7)'
        }
      }
    }
  }
}

export const neon = defineTheme(neonDefinition)

import { defineTheme, type ThemeDefinition } from '../themes/defineTheme.js'
import { snap, spring } from './preset-values.js'

// Glass: frosted translucent layers over a painted canvas, lit from the top edge.
const frost = (alpha: number) => `rgb(255 255 255 / ${alpha})`
const dusk = (alpha: number) => `rgb(30 20 60 / ${alpha})`
const blur = 'blur(18px) saturate(190%)'

export const glassDefinition: ThemeDefinition = {
  id: 'glass',
  name: 'Glass',
  tokens: {
    color: {
      surface: 'rgb(255 255 255 / 0.78)',
      foreground: '#23223b',
      mutedForeground: '#514d69',
      border: '#827c9c',
      accent: '#4f40a8',
      accentForeground: '#ffffff',
      neutral: 'rgb(255 255 255 / 0.8)',
      neutralForeground: '#302a51',
      warning: '#edc86d',
      warningForeground: '#44300c',
      danger: '#b52c44',
      dangerForeground: '#ffffff',
      focus: '#483790',
      placeholder: '#514d69',
      disabledBackground: 'rgb(255 255 255 / 0.8)',
      disabledBorder: '#827c9c',
      invalid: '#b52c44'
    },
    typography: {
      family: "'Manrope', system-ui, sans-serif",
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
      radius: '1.375rem',
      cornerShape: 'squircle',
      borderWidth: '1px',
      borderStyle: 'solid',
      action: {
        fontWeight: 700,
        shadow: `inset 0 0 0 1px ${frost(0.35)}, 0 10px 30px -10px ${dusk(0.35)}`,
        shadowPressed: `inset 0 0 0 1px ${frost(0.35)}, 0 4px 14px -6px ${dusk(0.35)}`,
        highlight: 0.9,
        sheen: 0.25
      },
      field: {
        background: frost(0.55),
        borderColor: frost(0.85),
        shadow: `inset 0 1px 0 ${frost(0.6)}, 0 6px 18px -10px ${dusk(0.3)}`,
        backdropFilter: blur
      },
      indicator: {
        shadow: `inset 0 1px 2px ${dusk(0.15)}`,
        checkedShadow: `inset 0 1px 0 ${frost(0.45)}, 0 4px 10px -4px ${dusk(0.4)}`,
        thumbShadow: `inset 0 1px 0 ${frost(0.9)}, 0 4px 12px -4px ${dusk(0.4)}`
      },
      track: {
        background: frost(0.45),
        borderWidth: '0px',
        shadow: `inset 0 1px 3px ${dusk(0.18)}`
      },
      selected: {
        background: frost(0.8),
        foreground: 'var(--rad-color-foreground)',
        borderColor: frost(0.95),
        shadow: `inset 0 1px 0 ${frost(0.9)}, 0 6px 16px -8px ${dusk(0.35)}`
      },
      item: { highlightBackground: frost(0.65), highlightForeground: 'var(--rad-color-foreground)' }
    },
    surface: {
      canvas:
        'radial-gradient(40% 80% at 15% 30%, #8ad3ee, transparent 70%), radial-gradient(45% 90% at 55% 80%, #e8abe0, transparent 70%), radial-gradient(40% 80% at 90% 20%, #fae8a0, transparent 70%), #e6e2f3',
      radius: '1.75rem',
      cornerShape: 'squircle',
      borderWidth: '1px',
      borderStyle: 'solid',
      padding: '1.5rem',
      gap: '1rem',
      shadow: `inset 0 1px 0 ${frost(0.7)}, 0 16px 40px -20px ${dusk(0.35)}`,
      overlayShadow: `inset 0 1px 0 ${frost(0.8)}, 0 24px 60px -16px ${dusk(0.45)}`,
      overlayBackground: frost(0.72),
      backdrop: 'rgb(40 30 80 / 0.25)',
      backdropFilter: blur
    },
    focus: {
      width: '2px',
      offset: '3px',
      style: 'dashed'
    },
    motion: {
      pressDuration: '120ms',
      pressEase: snap,
      releaseDuration: '600ms',
      releaseEase: spring,
      colorDuration: '150ms',
      disclosureDuration: '200ms',
      pressScale: 0.94
    },
    state: { disabledOpacity: 0.5 }
  },
  components: {
    select: { contentBackground: frost(0.92), contentBackdropFilter: blur },
    dialog: { backdropFilter: blur },
    button: { backdrop: blur }
  },
  modes: {
    dark: {
      components: { select: { contentBackground: 'rgb(27 25 48 / 0.94)' } },
      tokens: {
        color: {
          surface: 'rgb(27 25 48 / 0.9)',
          foreground: '#f1edff',
          mutedForeground: '#bfb6d9',
          border: '#83759e',
          accent: '#c3b3ff',
          accentForeground: '#291c52',
          neutral: 'rgb(61 50 88 / 0.92)',
          neutralForeground: '#f1eaff',
          warning: '#efc355',
          warningForeground: '#352507',
          danger: '#ff9db0',
          dangerForeground: '#3f1021',
          focus: '#d4c7ff',
          placeholder: '#bfb6d9',
          disabledBackground: 'rgb(61 50 88 / 0.92)',
          disabledBorder: '#83759e',
          invalid: '#ff9db0'
        },
        surface: {
          canvas:
            'radial-gradient(40% 80% at 15% 30%, #164664, transparent 70%), radial-gradient(45% 90% at 55% 80%, #532852, transparent 70%), radial-gradient(40% 80% at 90% 20%, #524019, transparent 70%), #151225',
          shadow: `inset 0 1px 0 ${frost(0.12)}, 0 16px 40px -20px rgb(0 0 0 / 0.7)`,
          overlayShadow: `inset 0 1px 0 ${frost(0.16)}, 0 24px 60px -16px rgb(0 0 0 / 0.8)`,
          overlayBackground: 'rgb(27 25 48 / 0.8)',
          backdrop: 'rgb(0 0 0 / 0.5)'
        },
        control: {
          field: {
            background: frost(0.07),
            borderColor: frost(0.2),
            shadow: `inset 0 1px 0 ${frost(0.08)}`
          },
          track: { background: frost(0.1), shadow: 'inset 0 1px 3px rgb(0 0 0 / 0.35)' },
          selected: {
            background: frost(0.16),
            borderColor: frost(0.28),
            shadow: `inset 0 1px 0 ${frost(0.2)}, 0 6px 16px -8px rgb(0 0 0 / 0.6)`
          },
          item: { highlightBackground: frost(0.12) }
        }
      }
    }
  }
}

export const glass = defineTheme(glassDefinition)

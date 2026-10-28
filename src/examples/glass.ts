import { defineTheme, type ThemeDefinition } from '../themes/defineTheme.js'
import { snap, spring } from './preset-values.js'

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
      borderStyle: 'solid'
    },
    surface: {
      canvas:
        'radial-gradient(40% 80% at 15% 30%, #8ad3ee, transparent 70%), radial-gradient(45% 90% at 55% 80%, #e8abe0, transparent 70%), radial-gradient(40% 80% at 90% 20%, #fae8a0, transparent 70%), #e6e2f3',
      radius: '1.375rem',
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
      offset: '3px',
      style: 'dashed'
    },
    motion: {
      pressDuration: '120ms',
      pressEase: snap,
      releaseDuration: '600ms',
      releaseEase: spring,
      colorDuration: '150ms',
      disclosureDuration: '180ms'
    },
    state: { disabledOpacity: 0.5 }
  },
  components: {
    dialog: { backdropFilter: 'blur(18px) saturate(190%)' },
    button: {
      fontWeight: 700,
      shadow: 'inset 0 0 0 1px rgb(255 255 255 / 0.35), 0 10px 30px -10px rgb(30 20 60 / 0.35)',
      shadowPressed:
        'inset 0 0 0 1px rgb(255 255 255 / 0.35), 0 4px 14px -6px rgb(30 20 60 / 0.35)',
      sheen: 0.25,
      highlight: 0.9,
      backdrop: 'blur(18px) saturate(190%)',
      glow: '0%',
      pressScale: 0.94
    }
  },
  modes: {
    dark: {
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
          shadow: '0 1px 4px rgb(0 0 0 / 0.4)',
          overlayShadow: '0 20px 60px rgb(0 0 0 / 0.65)',
          backdrop: 'rgb(0 0 0 / 0.65)'
        }
      }
    }
  }
}

export const glass = defineTheme(glassDefinition)

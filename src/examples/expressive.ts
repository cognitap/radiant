import { defineTheme, type ThemeDefinition } from '../themes/defineTheme.js'
import { spring } from './preset-values.js'

export const expressiveDefinition: ThemeDefinition = {
  id: 'expressive',
  name: 'Expressive',
  tokens: {
    color: {
      surface: '#ffffff',
      foreground: '#402266',
      mutedForeground: '#746084',
      border: '#cbb6e0',
      accent: '#6732b4',
      accentForeground: '#ffffff',
      neutral: '#eee4fa',
      neutralForeground: '#452267',
      warning: '#efc355',
      warningForeground: '#44300c',
      danger: '#b52c34',
      dangerForeground: '#ffffff',
      focus: '#6732b4',
      placeholder: '#746084',
      disabledBackground: '#eee4fa',
      disabledBorder: '#cbb6e0',
      invalid: '#b52c34'
    },
    typography: {
      family: "'Poppins', system-ui, sans-serif",
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
      cornerShape: 'round',
      borderWidth: '1px',
      borderStyle: 'solid'
    },
    surface: {
      canvas: '#f7f0ff',
      radius: '1.5rem',
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
      width: '6px',
      offset: '2px',
      style: 'double'
    },
    motion: {
      pressDuration: '450ms',
      pressEase: spring,
      releaseDuration: '450ms',
      releaseEase: spring,
      colorDuration: '150ms',
      disclosureDuration: '180ms'
    },
    state: { disabledOpacity: 0.5 }
  },
  components: {
    button: {
      radiusPressed: '0.75rem',
      sheen: 0,
      glow: '0%',
      hoverLift: '0px',
      fontWeight: 600,
      shadow: '0 0 #0000',
      shadowPressed: '0 0 #0000',
      highlight: 0,
      pressScale: 0.98
    }
  },
  modes: {
    dark: {
      tokens: {
        color: {
          surface: '#271c36',
          foreground: '#f5eaff',
          mutedForeground: '#c8b2dc',
          border: '#806297',
          accent: '#c4a0ff',
          accentForeground: '#301253',
          neutral: '#423055',
          neutralForeground: '#f2e3ff',
          warning: '#efc355',
          warningForeground: '#352507',
          danger: '#ff9298',
          dangerForeground: '#3c111a',
          focus: '#d1b4ff',
          placeholder: '#c8b2dc',
          disabledBackground: '#423055',
          disabledBorder: '#806297',
          invalid: '#ff9298'
        },
        surface: {
          canvas: '#191122',
          shadow: '0 1px 4px rgb(0 0 0 / 0.4)',
          overlayShadow: '0 20px 60px rgb(0 0 0 / 0.65)',
          backdrop: 'rgb(0 0 0 / 0.65)'
        }
      }
    }
  }
}

export const expressive = defineTheme(expressiveDefinition)

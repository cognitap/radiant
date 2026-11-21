/**
 * Custom properties that components built outside Radiant may read. Every theme and mode
 * sets them, so a component drawn with them follows `ThemeScope`. Other `--rad-` names are
 * component overrides or internals and may change.
 */
export const PUBLIC_THEME_TOKENS = [
  '--rad-color-surface',
  '--rad-color-foreground',
  '--rad-color-muted-foreground',
  '--rad-color-border',
  '--rad-color-focus',
  '--rad-color-accent',
  '--rad-color-accent-foreground',
  '--rad-color-neutral',
  '--rad-color-neutral-foreground',
  '--rad-color-warning',
  '--rad-color-warning-foreground',
  '--rad-color-danger',
  '--rad-color-danger-foreground',
  '--rad-color-invalid',
  '--rad-color-disabled-background',
  '--rad-color-disabled-border',
  '--rad-typography-family',
  '--rad-typography-body-size',
  '--rad-typography-small-size',
  '--rad-typography-heading-size',
  '--rad-typography-body-weight',
  '--rad-typography-label-weight',
  '--rad-typography-heading-weight',
  '--rad-control-radius',
  '--rad-control-border-width',
  '--rad-control-border-style',
  '--rad-surface-canvas',
  '--rad-surface-radius',
  '--rad-surface-border-width',
  '--rad-surface-border-style',
  '--rad-surface-padding',
  '--rad-surface-gap',
  '--rad-surface-shadow',
  '--rad-focus-width',
  '--rad-focus-offset',
  '--rad-focus-style',
  '--rad-motion-color-duration',
  '--rad-spacing-tight',
  '--rad-spacing-normal',
  '--rad-spacing-airy',
  '--rad-state-disabled-opacity'
] as const

export type PublicThemeToken = (typeof PUBLIC_THEME_TOKENS)[number]

/** Returns `var(<token>)`, with an optional fallback, for inline styles. SVG attributes do not resolve `var()`. */
export function themeTokenVar(token: PublicThemeToken, fallback?: string): string {
  return fallback === undefined ? `var(${token})` : `var(${token}, ${fallback})`
}

/** The complete shared-token registry. CSS names are derived from these paths. */
export interface SharedTokens {
  color: {
    surface: string
    foreground: string
    mutedForeground: string
    border: string
    placeholder: string
    disabledBackground: string
    disabledBorder: string
    invalid: string
    focus: string
    accent: string
    accentForeground: string
    neutral: string
    neutralForeground: string
    warning: string
    warningForeground: string
    danger: string
    dangerForeground: string
  }
  typography: {
    family: string
    bodySize: string
    smallSize: string
    headingSize: string
    bodyWeight: string | number
    labelWeight: string | number
    headingWeight: string | number
    letterSpacing: string
  }
  control: {
    small: ControlMetrics
    medium: ControlMetrics
    large: ControlMetrics
    radius: string
    cornerShape: string
    borderWidth: string
    borderStyle: string
  }
  surface: {
    canvas: string
    radius: string
    cornerShape: string
    borderWidth: string
    borderStyle: string
    padding: string
    gap: string
    shadow: string
    overlayShadow: string
    backdrop: string
  }
  focus: { width: string; offset: string; style: string }
  motion: {
    pressDuration: string
    pressEase: string
    releaseDuration: string
    releaseEase: string
    colorDuration: string
    disclosureDuration: string
  }
  spacing: {
    labelGap: string
    fieldGap: string
    groupGap: string
    headerGap: string
    footerGap: string
  }
  state: { disabledOpacity: number }
}

interface ControlMetrics {
  height: string
  paddingInline: string
  fontSize: string
  indicatorSize: string
}

export type PartialTree<T> = {
  readonly [K in keyof T]?: T[K] extends object ? PartialTree<T[K]> : T[K]
}
export type ThemeTokens = PartialTree<SharedTokens>
export type ThemeVariableValues = Record<`--rad-${string}`, string | number>

const light: SharedTokens = {
  color: {
    surface: 'oklch(1 0 0)',
    foreground: 'oklch(0.21 0.006 286)',
    mutedForeground: 'oklch(0.45 0.01 286)',
    border: 'oklch(0.885 0.005 286)',
    placeholder: 'oklch(0.5 0.01 286)',
    disabledBackground: 'oklch(0.96 0.005 286)',
    disabledBorder: 'oklch(0.88 0.005 286)',
    invalid: 'oklch(0.56 0.19 25)',
    focus: 'oklch(0.55 0.13 255)',
    accent: 'oklch(0.21 0.006 286)',
    accentForeground: 'oklch(0.985 0 0)',
    neutral: 'oklch(0.955 0.004 286)',
    neutralForeground: 'oklch(0.21 0.006 286)',
    warning: 'oklch(0.8 0.14 78)',
    warningForeground: 'oklch(0.3 0.07 55)',
    danger: 'oklch(0.56 0.19 25)',
    dangerForeground: 'oklch(0.99 0 0)'
  },
  typography: {
    family: 'system-ui, sans-serif',
    bodySize: '0.875rem',
    smallSize: '0.8125rem',
    headingSize: '1.125rem',
    bodyWeight: 400,
    labelWeight: 550,
    headingWeight: 600,
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
    canvas: 'oklch(1 0 0)',
    radius: '0.75rem',
    cornerShape: 'round',
    borderWidth: '1px',
    borderStyle: 'solid',
    padding: '1.5rem',
    gap: '1rem',
    shadow: '0 1px 2px 0 rgb(0 0 0 / 0.06)',
    overlayShadow: '0 24px 64px -16px rgb(0 0 0 / 0.3)',
    backdrop: 'rgb(0 0 0 / 0.45)'
  },
  focus: { width: '2px', offset: '2px', style: 'solid' },
  motion: {
    pressDuration: '80ms',
    pressEase: 'cubic-bezier(0.3, 0, 0, 1)',
    releaseDuration: '160ms',
    releaseEase: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    colorDuration: '150ms',
    disclosureDuration: '150ms'
  },
  spacing: {
    labelGap: '0.5rem',
    fieldGap: '0.375rem',
    groupGap: '0.75rem',
    headerGap: '0.375rem',
    footerGap: '0.5rem'
  },
  state: { disabledOpacity: 0.5 }
}

const dark: SharedTokens = {
  ...light,
  color: {
    surface: 'oklch(0.21 0.006 286)',
    foreground: 'oklch(0.985 0 0)',
    mutedForeground: 'oklch(0.75 0.01 286)',
    border: 'oklch(0.4 0.008 286)',
    placeholder: 'oklch(0.7 0.01 286)',
    disabledBackground: 'oklch(0.26 0.006 286)',
    disabledBorder: 'oklch(0.38 0.006 286)',
    invalid: 'oklch(0.75 0.16 25)',
    focus: 'oklch(0.75 0.13 255)',
    accent: 'oklch(0.92 0.005 286)',
    accentForeground: 'oklch(0.21 0.006 286)',
    neutral: 'oklch(0.3 0.006 286)',
    neutralForeground: 'oklch(0.985 0 0)',
    warning: 'oklch(0.8 0.14 78)',
    warningForeground: 'oklch(0.3 0.07 55)',
    danger: 'oklch(0.72 0.17 25)',
    dangerForeground: 'oklch(0.2 0.04 25)'
  },
  surface: {
    ...light.surface,
    canvas: 'oklch(0.16 0.006 286)',
    shadow: '0 1px 2px 0 rgb(0 0 0 / 0.25)',
    overlayShadow: '0 24px 64px -16px rgb(0 0 0 / 0.6)',
    backdrop: 'rgb(0 0 0 / 0.65)'
  }
}

/** Immutable at runtime as well as in declarations: defaults are shared by every theme. */
export function freezeTree<T extends object>(value: T): Readonly<T> {
  for (const item of Object.values(value)) {
    if (item && typeof item === 'object') freezeTree(item)
  }
  return Object.freeze(value)
}

export const tokenDefaults = freezeTree({ light, dark })

export function kebabCase(value: string): string {
  return value.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
}

export function flattenTokens(tokens: ThemeTokens): ThemeVariableValues {
  const result: ThemeVariableValues = {}
  function visit(tree: object, path: string[]) {
    for (const [key, value] of Object.entries(tree)) {
      if (value === undefined) continue
      const next = [...path, kebabCase(key)]
      if (typeof value === 'object' && value !== null) visit(value, next)
      else result[`--rad-${next.join('-')}`] = value
    }
  }
  visit(tokens, [])
  return result
}

/** Registry-derived CSS names keyed by canonical dotted authoring paths. */
function collectTokenVariables(
  tree: object,
  path: string[] = []
): Record<string, `--rad-${string}`> {
  const variables: Record<string, `--rad-${string}`> = {}
  for (const [key, value] of Object.entries(tree)) {
    const next = [...path, key]
    if (typeof value === 'object' && value !== null)
      Object.assign(variables, collectTokenVariables(value, next))
    else variables[next.join('.')] = `--rad-${next.map(kebabCase).join('-')}`
  }
  return variables
}

export const tokenVariables = Object.freeze(collectTokenVariables(light))

/** Select values through inherited CSS flags; no browser APIs or first-render mode guesses. */
export function modeStyle(
  light: Readonly<ThemeVariableValues>,
  dark: Readonly<ThemeVariableValues>
): ThemeVariableValues {
  const style: ThemeVariableValues = {}
  for (const variable of Object.keys(light) as Array<keyof ThemeVariableValues>) {
    const lightValue = light[variable]
    const darkValue = dark[variable]
    if (lightValue === darkValue) style[variable] = lightValue
    else {
      const lightBranch = lightValue === 'initial' ? 'var(--_rad-unset)' : lightValue
      const darkBranch = darkValue === 'initial' ? 'var(--_rad-unset)' : darkValue
      style[variable] = `var(--_rad-light, ${lightBranch}) var(--_rad-dark, ${darkBranch})`
    }
  }
  return style
}

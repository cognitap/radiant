import type {
  TypographyProseRhythm,
  TypographyUIRhythm,
  TypographyStyle,
  TypographyRole,
  TypographyTokens,
  TypographyAssignment
} from '../typography/types.js'

/** Canonical calculations live beside the defaults so source CSS generation stays self-contained. */
export function typographyStyles(
  prose: TypographyProseRhythm,
  ui: TypographyUIRhythm
): Record<TypographyRole, TypographyStyle> {
  const { size: r, lineHeight, measure, headingScale: q } = prose
  const u = ui.size
  const style = (
    assignment: TypographyAssignment,
    narrow: number,
    wide: number,
    weight: number,
    leading: number,
    tracking = 0,
    width = 0
  ): TypographyStyle => ({
    assignment,
    narrow,
    wide,
    weight,
    lineHeight: leading,
    tracking,
    measure: width
  })
  return {
    'prose-title': style('headings', r * q ** 3, r * q ** 5, 600, 1.12, -0.025, 22),
    'prose-heading': style('headings', r * q, r * q ** 2, 600, 1.25, -0.015, 30),
    'prose-subheading': style('headings', r * 1.1, r * q, 600, 1.3, -0.01, 36),
    'prose-body': style('body', r, r, 400, lineHeight, 0, measure),
    'prose-lead': style('body', r * 1.125, r * 1.125, 400, 1.5, 0, 55),
    'prose-small': style('body', r * 0.8, r * 0.8, 400, 1.5, 0, measure),
    'prose-quote': style('body', r * 1.25, r * 1.25, 400, 1.4, -0.01, measure),
    'ui-title': style('ui', u * 1.25, u * 1.25, 600, 1.3, -0.015),
    'ui-body': style('ui', u, u, 400, ui.lineHeight),
    'ui-label': style('ui', u, u, 500, 1.4),
    'ui-supporting': style('ui', u * 0.9375, u * 0.9375, 400, 1.5),
    'ui-caption': style('ui', u * 0.875, u * 0.875, 400, 1.5),
    'ui-metric': style('ui', u * 2, u * 2, 600, 1.15, -0.03),
    'ui-eyebrow': style('ui', u * 0.75, u * 0.75, 600, 1.4, 0.1),
    display: style('headings', r * q ** 3, r * q ** 6, 600, 1.06, -0.035, 18),
    code: style('code', 14, 14, 400, 1.65, 0, 80)
  }
}

const baselineProse: TypographyProseRhythm = {
  size: 20,
  lineHeight: 1.6,
  paragraphSpacing: 1.25,
  measure: 64,
  headingScale: 1.25
}
export const typographyRoles = Object.freeze(
  Object.keys(typographyStyles(baselineProse, { size: 16, lineHeight: 1.5 })) as TypographyRole[]
)

function decimal(value: number): string {
  return String(Number(value.toFixed(8)))
}

export function typographyTokens(
  styles: Readonly<Record<TypographyRole, TypographyStyle>>,
  families: Readonly<Record<TypographyAssignment, string>>,
  flow: number
): TypographyTokens {
  const roles = {} as Record<TypographyRole, TypographyTokens['roles'][TypographyRole]>
  for (const role of typographyRoles) {
    const s = styles[role]
    const slope = (s.wide - s.narrow) / 512
    const intercept = s.narrow / 16 - slope * 24
    const size = `${decimal(s.narrow / 16)}rem`
    roles[role] = {
      family: families[s.assignment],
      size,
      fluidSize:
        s.narrow === s.wide
          ? size
          : `clamp(${size}, calc(${decimal(intercept)}rem + ${decimal(slope * 100)}cqi), ${decimal(s.wide / 16)}rem)`,
      weight: s.weight,
      lineHeight: decimal(s.lineHeight),
      letterSpacing: `${decimal(s.tracking)}em`,
      measure: s.measure ? `${decimal(s.measure)}ch` : 'none'
    }
  }
  return {
    roles,
    flow: {
      paragraph: `${decimal(flow)}em`,
      headingBefore: `${decimal(flow * 1.6)}em`,
      headingAfter: `${decimal(flow * 0.5)}em`
    }
  }
}

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
    roles: TypographyTokens['roles']
    flow: TypographyTokens['flow']
  }
  control: {
    small: ControlMetrics
    medium: ControlMetrics
    large: ControlMetrics
    radius: string
    cornerShape: string
    borderWidth: string
    borderStyle: string
    action: ActionTokens
    field: FieldTokens
    indicator: IndicatorTokens
    track: TrackTokens
    selected: SelectedTokens
    item: ItemTokens
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
    overlayBackground: string
    backdrop: string
    backdropFilter: string
  }
  focus: { width: string; offset: string; style: string }
  motion: {
    pressDuration: string
    pressEase: string
    releaseDuration: string
    releaseEase: string
    colorDuration: string
    disclosureDuration: string
    pressScale: number
    pressShiftX: string
    pressShiftY: string
    hoverLift: string
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

/** Everything pressable: Button, its composed parts and the pressables that are not Buttons. */
interface ActionTokens {
  fontFamily: string
  fontWeight: string | number
  textTransform: string
  letterSpacing: string
  borderColor: string
  shadow: string
  shadowPressed: string
  highlight: number
  sheen: number
  radiusPressed: string
  cornerShapePressed: string
}

/** Wells you type or pick into: Input, Textarea, select triggers, OTP slots. */
interface FieldTokens {
  background: string
  borderColor: string
  shadow: string
  backdropFilter: string
}

/** Checkbox and Radio boxes, Switch tracks, and the thumbs of Switch and Slider. */
interface IndicatorTokens {
  shadow: string
  checkedShadow: string
  thumbShadow: string
}

/** Progress, Meter and Slider rails, Skeleton and scrollbar thumbs. */
interface TrackTokens {
  background: string
  borderWidth: string
  shadow: string
}

/** The chosen member of a set: Tabs, ToggleGroup, Pagination, NavLink. */
interface SelectedTokens {
  background: string
  foreground: string
  borderColor: string
  shadow: string
}

/** Rows inside a container: menu, listbox and command items. */
interface ItemTokens {
  highlightBackground: string
  highlightForeground: string
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
    ...baselineTypographyTokens(),
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
    borderStyle: 'solid',
    action: {
      fontFamily: 'var(--rad-typography-roles-ui-label-family)',
      fontWeight: 'var(--rad-typography-roles-ui-label-weight)',
      textTransform: 'none',
      letterSpacing: 'var(--rad-typography-roles-ui-label-letter-spacing)',
      borderColor: 'initial',
      shadow: '0 1px 2px 0 rgb(0 0 0 / 0.06)',
      shadowPressed: '0 1px 2px 0 rgb(0 0 0 / 0.06)',
      highlight: 0,
      sheen: 0,
      radiusPressed: 'initial',
      cornerShapePressed: 'initial'
    },
    field: {
      background: 'var(--rad-color-surface)',
      borderColor: 'initial',
      shadow: 'none',
      backdropFilter: 'none'
    },
    indicator: { shadow: 'none', checkedShadow: 'none', thumbShadow: '0 1px 2px rgb(0 0 0 / 0.2)' },
    track: { background: 'var(--rad-color-neutral)', borderWidth: '0px', shadow: 'none' },
    selected: {
      background: 'initial',
      foreground: 'initial',
      borderColor: 'initial',
      shadow: 'initial'
    },
    item: { highlightBackground: 'initial', highlightForeground: 'initial' }
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
    overlayBackground: 'var(--rad-color-surface)',
    backdrop: 'rgb(0 0 0 / 0.45)',
    backdropFilter: 'none'
  },
  focus: { width: '2px', offset: '2px', style: 'solid' },
  motion: {
    pressDuration: '80ms',
    pressEase: 'cubic-bezier(0.3, 0, 0, 1)',
    releaseDuration: '160ms',
    releaseEase: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    colorDuration: '150ms',
    disclosureDuration: '150ms',
    pressScale: 0.97,
    pressShiftX: '0px',
    pressShiftY: '0px',
    hoverLift: '0px'
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

// Legacy/preset leaves remain a bridge until a recipe or explicit role owns them.
// UI measures stay layout-owned; controls retain their independent size metrics.
function baselineTypographyTokens(): TypographyTokens {
  const tokens = typographyTokens(
    typographyStyles(baselineProse, { size: 16, lineHeight: 1.5 }),
    {
      body: 'var(--rad-typography-family)',
      headings: 'var(--rad-typography-family)',
      ui: 'var(--rad-typography-family)',
      code: 'ui-monospace, monospace'
    },
    baselineProse.paragraphSpacing
  )
  const roles = { ...tokens.roles }
  for (const [role, size, weight] of [
    ['ui-body', 'bodySize', 'bodyWeight'],
    ['ui-label', 'bodySize', 'labelWeight'],
    ['ui-title', 'headingSize', 'headingWeight'],
    ['ui-supporting', 'smallSize', 'bodyWeight']
  ] as const) {
    const leaf = (name: string) => `var(--rad-typography-${kebabCase(name)})`
    roles[role] = {
      ...tokens.roles[role],
      size: leaf(size),
      fluidSize: leaf(size),
      weight: leaf(weight),
      letterSpacing: leaf('letterSpacing')
    }
  }
  return { ...tokens, roles }
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

import {
  freezeTree,
  typographyRoles,
  typographyStyles,
  typographyTokens
} from '../themes/tokens.js'
import type {
  TypographyAssignment,
  TypographyFont,
  TypographyInput,
  TypographyProfile,
  TypographyProseRhythm,
  TypographyResult
} from './types.js'
export type * from './types.js'
export { typographyRoles }

const inter = { family: 'Inter, system-ui, sans-serif', profile: 'inter' } as const
const serif = { family: '"Source Serif 4", Georgia, serif', profile: 'source-serif-4' } as const
const plex = { family: '"IBM Plex Sans", system-ui, sans-serif', profile: 'plex-sans' } as const
const mono = { family: '"IBM Plex Mono", ui-monospace, monospace', profile: 'plex-mono' } as const
export const typographyPresets = freezeTree({
  inter: { name: 'Inter', fonts: { body: inter, headings: inter, ui: inter, code: mono } },
  'source-serif': {
    name: 'Source Serif 4 + Inter',
    fonts: { body: serif, headings: serif, ui: inter, code: mono }
  },
  plex: {
    name: 'Plex Sans + Plex Mono',
    fonts: { body: plex, headings: plex, ui: plex, code: mono }
  }
} as const)
const assignments: readonly TypographyAssignment[] = ['body', 'headings', 'ui', 'code']
const profiles: readonly TypographyProfile[] = [
  'inter',
  'source-serif-4',
  'plex-sans',
  'plex-mono',
  'manual'
]
const bodyProfiles: Partial<Record<TypographyProfile, readonly [number, number, number]>> = {
  inter: [20, 1.6, 64],
  'source-serif-4': [21, 1.65, 62],
  'plex-sans': [20, 1.6, 62]
}
const weights: Partial<Record<TypographyProfile, readonly [number, number]>> = {
  inter: [100, 900],
  'source-serif-4': [200, 900],
  'plex-sans': [100, 700],
  'plex-mono': [100, 700]
}
function record(value: unknown, path: string): void {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(value))
  )
    throw new TypeError(`${path} must be a plain object.`)
}
function keys(value: object, allowed: readonly string[], path: string) {
  for (const key of Object.keys(value))
    if (!allowed.includes(key)) throw new TypeError(`Unknown key: ${path}.${key}.`)
}
function number(value: unknown, min: number, max: number, path: string) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
    throw new TypeError(`${path} must be a finite number from ${min} to ${max}.`)
}
function metrics(value: object, bounds: Record<string, readonly [number, number]>, path: string) {
  record(value, path)
  keys(value, Object.keys(bounds), path)
  for (const [key, item] of Object.entries(value))
    if (item !== undefined) number(item, ...bounds[key], `${path}.${key}`)
}

/** Pure, server-safe calculations. Input omits automatic metrics; output never loads a font. */
export function generateTypography(input: TypographyInput = {}): TypographyResult {
  record(input, 'typography')
  keys(input, ['preset', 'fonts', 'prose', 'ui', 'styles'], 'typography')
  const preset = input.preset === undefined ? 'inter' : input.preset
  if (typeof preset !== 'string' || !Object.hasOwn(typographyPresets, preset))
    throw new TypeError('Unknown typography.preset.')
  const fonts = { ...typographyPresets[preset].fonts } as Record<
    TypographyAssignment,
    TypographyFont
  >
  if (input.fonts !== undefined) {
    record(input.fonts, 'typography.fonts')
    keys(input.fonts, assignments, 'typography.fonts')
    for (const key of assignments) {
      const font = input.fonts[key]
      if (font === undefined) continue
      record(font, `typography.fonts.${key}`)
      keys(font, ['family', 'profile'], `typography.fonts.${key}`)
      if (
        typeof font.family !== 'string' ||
        !font.family.trim() ||
        /[;{}@]|url\s*\(/i.test(font.family) ||
        [...font.family].some(
          character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127
        )
      )
        throw new TypeError(`typography.fonts.${key}.family must be a CSS font-family list.`)
      if (font.profile !== undefined && !profiles.includes(font.profile))
        throw new TypeError(`Unknown typography.fonts.${key}.profile.`)
      fonts[key] = { family: font.family, profile: font.profile ?? 'manual' }
    }
  }
  const manualProse = input.prose === undefined ? {} : input.prose,
    manualUI = input.ui === undefined ? {} : input.ui
  metrics(
    manualProse,
    {
      size: [12, 40],
      lineHeight: [1, 3],
      paragraphSpacing: [0, 4],
      measure: [20, 120],
      headingScale: [1.1, 1.5]
    },
    'typography.prose'
  )
  metrics(manualUI, { size: [12, 32], lineHeight: [1, 3] }, 'typography.ui')
  const profile = bodyProfiles[fonts.body.profile ?? 'manual']
  const prose: TypographyProseRhythm = {
    size: profile?.[0] ?? 20,
    lineHeight: profile?.[1] ?? 1.65,
    measure: profile?.[2] ?? 64,
    paragraphSpacing: 1.25,
    headingScale: 1.25,
    ...defined(manualProse)
  }
  const ui = { size: 16, lineHeight: 1.5, ...defined(manualUI) }
  const styles = typographyStyles(prose, ui)
  const overrides = input.styles === undefined ? {} : input.styles
  record(overrides, 'typography.styles')
  keys(overrides, typographyRoles, 'typography.styles')
  for (const role of typographyRoles) {
    const override = overrides[role]
    if (override === undefined) continue
    record(override, `typography.styles.${role}`)
    const { assignment, ...numeric } = override
    if (assignment !== undefined && !assignments.includes(assignment))
      throw new TypeError(`Unknown typography.styles.${role}.assignment.`)
    metrics(
      numeric,
      {
        narrow: [8, 256],
        wide: [8, 512],
        weight: [1, 1000],
        lineHeight: [0.8, 3],
        tracking: [-0.2, 0.5],
        measure: [0, 120]
      },
      `typography.styles.${role}`
    )
    styles[role] = { ...styles[role], ...defined(override) }
    if (styles[role].wide < styles[role].narrow)
      throw new TypeError(`typography.styles.${role}.wide must be at least narrow.`)
  }
  const warnings: TypographyResult['warnings'][number][] = []
  for (const role of typographyRoles) {
    const s = styles[role],
      range = weights[fonts[s.assignment].profile ?? 'manual']
    if (range && (s.weight < range[0] || s.weight > range[1]))
      warnings.push({ role, requestedWeight: s.weight, supportedWeights: range })
  }
  return freezeTree({
    input: {
      preset,
      fonts,
      prose: defined(manualProse),
      ui: defined(manualUI),
      styles: Object.fromEntries(
        Object.entries(overrides)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, defined(v!)])
      )
    },
    prose,
    ui,
    styles,
    tokens: typographyTokens(
      styles,
      Object.fromEntries(assignments.map(key => [key, fonts[key].family])) as Record<
        TypographyAssignment,
        string
      >,
      prose.paragraphSpacing
    ),
    recommendations: {
      body: !!profile,
      ui: fonts.ui.profile === 'inter' || fonts.ui.profile === 'plex-sans'
    },
    warnings
  })
}
function defined<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T
}

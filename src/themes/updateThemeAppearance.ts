import type { ColorPalette } from '../color/recommendColorPalette.js'
import { tokenDefaults, type ThemeTokens } from './tokens.js'
import { defineThemeDocument, updateThemeDocument } from './themeDocument.js'
import type { ThemeDocument, ThemeSection } from './themeDocumentTypes.js'

/** Bounded workshop controls; dimensions are derived from the neutral baseline, not compounded. */
export interface ThemeGeometrySettings {
  /** 0.5–2; scales shared gaps and panel padding, retaining rem units. */
  readonly spacing?: number
  /** 0.75–1.5; scales all three control heights, inline padding and indicators, not fonts. */
  readonly density?: number
  /** Pixels, 0–32. Checkbox still caps its inherited radius; Radio stays circular. */
  readonly controlRadius?: number
  /** Pixels, 0–48. */
  readonly surfaceRadius?: number
  /** Pixels, 0–4. */
  readonly controlBorderWidth?: number
  readonly surfaceBorderWidth?: number
  readonly borderStyle?: 'solid' | 'dashed' | 'dotted'
  /** 0 = none, 1 = baseline, 2 = raised, 3 = floating. Passive and overlay shadows only. */
  readonly elevation?: 0 | 1 | 2 | 3
  /** 0–0.9; black modal backdrop. Panel filtering remains a component exception. */
  readonly backdropOpacity?: number
}

export interface ThemeAppearanceSettings {
  readonly version?: 1
  readonly palette?: Pick<ColorPalette, 'version' | 'color' | 'surface'>
  readonly geometry?: ThemeSection<ThemeGeometrySettings>
}

const bounds = {
  spacing: [0.5, 2],
  density: [0.75, 1.5],
  controlRadius: [0, 32],
  surfaceRadius: [0, 48],
  controlBorderWidth: [0, 4],
  surfaceBorderWidth: [0, 4],
  elevation: [0, 3],
  backdropOpacity: [0, 0.9]
} as const
function record(value: unknown, path: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new TypeError(`${path} must be an object.`)
}
function keys(value: object, allowed: readonly string[], path: string) {
  for (const key of Object.keys(value))
    if (!allowed.includes(key)) throw new TypeError(`Unknown ${path}.${key}.`)
}
function validate(value: unknown, path: string): asserts value is ThemeGeometrySettings {
  record(value, path)
  keys(value, [...Object.keys(bounds), 'borderStyle'], path)
  for (const [key, item] of Object.entries(value)) {
    if (item === undefined) continue
    if (key === 'borderStyle') {
      if (typeof item === 'string' && ['solid', 'dashed', 'dotted'].includes(item)) continue
    } else {
      const [min, max] = bounds[key as keyof typeof bounds]
      if (
        typeof item === 'number' &&
        Number.isFinite(item) &&
        item >= min &&
        item <= max &&
        (key !== 'elevation' || Number.isInteger(item))
      )
        continue
      throw new TypeError(
        `${path}.${key} must be a finite number from ${min} to ${max}${key === 'elevation' ? ' (integer)' : ''}.`
      )
    }
    throw new TypeError(`${path}.borderStyle must be solid, dashed or dotted.`)
  }
}
const scaled = (rem: string, factor: number) =>
  `${Number((parseFloat(rem) * factor).toFixed(6))}rem`

function geometryTokens(settings: ThemeGeometrySettings, mode: 'light' | 'dark'): ThemeTokens {
  const base = tokenDefaults[mode]
  const spacing: Record<string, string> = {}
  const control: Record<string, unknown> = {}
  const surface: Record<string, string> = {}
  if (settings.spacing !== undefined) {
    for (const [key, value] of Object.entries(base.spacing))
      spacing[key] = scaled(value, settings.spacing)
    for (const key of ['padding', 'gap'] as const)
      surface[key] = scaled(base.surface[key], settings.spacing)
  }
  if (settings.density !== undefined)
    for (const size of ['small', 'medium', 'large'] as const) {
      const metrics: Record<string, string> = {}
      for (const key of ['height', 'paddingInline', 'indicatorSize'] as const)
        metrics[key] = scaled(base.control[size][key], settings.density)
      control[size] = metrics
    }
  for (const [key, target] of [
    ['Radius', 'radius'],
    ['BorderWidth', 'borderWidth']
  ] as const) {
    const a = settings[`control${key}`],
      b = settings[`surface${key}`]
    if (a !== undefined) control[target] = `${a}px`
    if (b !== undefined) surface[target] = `${b}px`
  }
  if (settings.borderStyle !== undefined)
    control.borderStyle = surface.borderStyle = settings.borderStyle
  if (settings.elevation !== undefined) {
    const level = settings.elevation
    surface.shadow =
      level === 0
        ? 'none'
        : level === 1
          ? base.surface.shadow
          : `0 ${level * 2}px ${level * 6}px -2px rgb(0 0 0 / ${mode === 'light' ? 0.12 : 0.4})`
    surface.overlayShadow =
      level === 0
        ? 'none'
        : level === 1
          ? base.surface.overlayShadow
          : `0 ${level * 12}px ${level * 32}px -16px rgb(0 0 0 / ${mode === 'light' ? 0.3 : 0.6})`
  }
  if (settings.backdropOpacity !== undefined)
    surface.backdrop = `rgb(0 0 0 / ${settings.backdropOpacity})`
  return {
    ...(Object.keys(spacing).length ? { spacing } : {}),
    ...(Object.keys(control).length ? { control } : {}),
    ...(Object.keys(surface).length ? { surface } : {})
  }
}

/** Apply generated color/canvas atomically and geometry leaves without erasing authored exceptions. */
export function updateThemeAppearance(
  document: ThemeDocument,
  settings: ThemeAppearanceSettings
): ThemeDocument {
  record(settings, 'appearance')
  keys(settings, ['version', 'palette', 'geometry'], 'appearance')
  if (settings.version !== undefined && settings.version !== 1)
    throw new TypeError('Unsupported appearance.version; expected 1.')
  let next = defineThemeDocument(document)
  if (settings.palette !== undefined) {
    record(settings.palette, 'appearance.palette')
    if (settings.palette.version !== 1) throw new TypeError('appearance.palette.version must be 1.')
    record(settings.palette.color, 'appearance.palette.color')
    record(settings.palette.surface, 'appearance.palette.surface')
    next = updateThemeDocument(next, { color: settings.palette.color }, 'replace')
    next = updateThemeDocument(next, { surface: settings.palette.surface })
  }
  const geometry = settings.geometry
  if (geometry === undefined) return next
  record(geometry, 'appearance.geometry')
  keys(geometry, ['values', 'modes'], 'appearance.geometry')
  if (geometry.values !== undefined) validate(geometry.values, 'appearance.geometry.values')
  if (geometry.modes !== undefined) {
    record(geometry.modes, 'appearance.geometry.modes')
    keys(geometry.modes, ['light', 'dark'], 'appearance.geometry.modes')
  }
  for (const mode of ['light', 'dark'] as const) {
    if (geometry.modes?.[mode] !== undefined)
      validate(geometry.modes[mode], `appearance.geometry.modes.${mode}`)
    const values = { ...geometry.values }
    for (const [key, value] of Object.entries(geometry.modes?.[mode] ?? {}))
      if (value !== undefined) Object.assign(values, { [key]: value })
    const tokens = geometryTokens(values, mode)
    next = updateThemeDocument(
      next,
      Object.fromEntries(
        Object.entries(tokens).map(([group, value]) => [group, { modes: { [mode]: value } }])
      )
    )
  }
  return next
}

import type { SharedTokens } from '../themes/tokens.js'
import { freezeTree } from '../themes/tokens.js'
import { parseThemeDocument } from '../themes/themeDocument.js'
import type { ThemeColorSection, ThemePalette } from '../themes/themeDocumentTypes.js'
import type { ColorWall } from './generateColorWall.js'
import { colorFamilies } from './colorFamilies.js'
import { hueDifference, measureHex } from './oklch.js'

export type WorkingPaletteRole =
  | 'primary'
  | 'support'
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
type Mode = 'light' | 'dark'
type Colors = Readonly<SharedTokens['color']>
export type PaletteModeColors = Colors & { readonly canvas: string }
export interface ColorPaletteOptions {
  readonly version?: 1
  /** Existing wall palette IDs; originals and swatches are never rewritten. */
  readonly working?: Readonly<Partial<Record<WorkingPaletteRole, string>>>
  /** Explicit opaque sRGB overrides are retained, even when contrast fails. */
  readonly modes?: {
    readonly light?: Partial<PaletteModeColors>
    readonly dark?: Partial<PaletteModeColors>
  }
}
export interface PaletteColorPair {
  readonly background: string
  readonly foreground: string
}
export interface PaletteContrastCheck {
  readonly mode: Mode
  readonly foregroundRole: string
  readonly backgroundRole: string
  readonly foreground: string
  readonly background: string
  readonly ratio: number
  /** null marks an inactive-control exception, not a passing contrast requirement. */
  readonly minimum: 3 | 4.5 | null
  readonly pass: boolean | null
  readonly message: string
}
export interface ColorPalette {
  readonly version: 1
  readonly working: Readonly<
    Record<
      WorkingPaletteRole,
      {
        readonly paletteId: string
        readonly light: PaletteColorPair
        readonly dark: PaletteColorPair
      }
    >
  >
  readonly color: ThemeColorSection & {
    readonly modes: { readonly light: Colors; readonly dark: Colors }
  }
  readonly surface: {
    readonly modes: {
      readonly light: { readonly canvas: string }
      readonly dark: { readonly canvas: string }
    }
  }
  readonly checks: readonly PaletteContrastCheck[]
  readonly pass: boolean
}
const workingRoles = ['primary', 'support', 'neutral', 'success', 'warning', 'danger'] as const
const colorRoles = [
  'surface',
  'foreground',
  'mutedForeground',
  'border',
  'placeholder',
  'disabledBackground',
  'disabledBorder',
  'invalid',
  'focus',
  'accent',
  'accentForeground',
  'neutral',
  'neutralForeground',
  'warning',
  'warningForeground',
  'danger',
  'dangerForeground'
] as const
const modes = ['light', 'dark'] as const
const hex = /^#[0-9a-f]{6}$/i
function object(value: unknown, path: string): asserts value is object {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new TypeError(`${path} must be an object.`)
}
function keys(value: object, allowed: readonly string[], path: string) {
  for (const key of Object.keys(value))
    if (!allowed.includes(key)) throw new TypeError(`Unknown ${path}.${key}.`)
}
function opaque(value: unknown, path: string): asserts value is string {
  if (typeof value !== 'string' || !hex.test(value))
    throw new TypeError(`${path} must be an opaque six-digit sRGB hex color.`)
}
function luminance(value: string) {
  const [r, g, b] = [1, 3, 5]
    .map(i => parseInt(value.slice(i, i + 2), 16) / 255)
    .map(n => (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function contrast(a: string, b: string) {
  const x = luminance(a),
    y = luminance(b)
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}
const swatches = (palette: ThemePalette) => palette.swatches.map(s => s.value)
function choose(
  values: readonly string[],
  backgrounds: readonly string[],
  minimum: number,
  target: number
): string {
  const score = (value: string) => Math.min(...backgrounds.map(bg => contrast(value, bg)))
  const valid = values.filter(value => score(value) >= minimum)
  return valid.length
    ? valid.reduce((a, b) =>
        Math.abs(measureHex(a).L - target) <= Math.abs(measureHex(b).L - target) ? a : b
      )
    : values.reduce((a, b) => (score(a) >= score(b) ? a : b))
}
function pair(
  values: readonly string[],
  inks: readonly string[],
  backgrounds: readonly string[],
  target: number,
  boundary: boolean,
  fixedBackground?: string,
  fixedForeground?: string
): PaletteColorPair {
  const candidates = fixedBackground === undefined ? values : [fixedBackground]
  const foregrounds = fixedForeground === undefined ? inks : [fixedForeground]
  const ink = (background: string) =>
    foregrounds.reduce((a, b) => (contrast(a, background) >= contrast(b, background) ? a : b))
  const eligible = candidates.filter(
    bg =>
      contrast(ink(bg), bg) >= 6 &&
      (!boundary || backgrounds.every(surface => contrast(bg, surface) >= 3))
  )
  const acceptable = candidates.filter(
    bg =>
      contrast(ink(bg), bg) >= 4.5 &&
      (!boundary || backgrounds.every(surface => contrast(bg, surface) >= 3))
  )
  const pool = eligible.length ? eligible : acceptable.length ? acceptable : candidates
  const background = pool.reduce((a, b) =>
    Math.abs(measureHex(a).L - target) <= Math.abs(measureHex(b).L - target) ? a : b
  )
  return { background, foreground: ink(background) }
}

/** Recommend a six-family working set and audit actual opaque semantic pairs. */
export function recommendColorPalette(
  wall: ColorWall,
  options: ColorPaletteOptions = {}
): ColorPalette {
  object(wall, 'colorWall')
  object(wall.color, 'colorWall.color')
  object(wall.input, 'colorWall.input')
  if (wall.input.version !== 1) throw new TypeError('colorWall.input.version must be 1.')
  if (wall.color.brand?.gamut !== 'srgb')
    throw new TypeError('colorWall.color.brand.gamut must be srgb for semantic mapping version 1.')
  const parsed = parseThemeDocument({
    kind: 'radiant-theme-sections',
    version: 1,
    sections: { color: wall.color }
  })
  const color = parsed.sections.color!
  if (!color.brand || !color.palettes?.length)
    throw new TypeError('colorWall.color requires an original brand and populated palettes.')
  opaque(color.brand.value, 'colorWall.color.brand.value')
  for (const palette of color.palettes) {
    const stops = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
    if (
      palette.swatches.length !== stops.length ||
      palette.swatches.some((s, i) => s.stop !== stops[i])
    )
      throw new TypeError(
        `colorWall.${palette.id} must contain the eleven ordered generator stops (50–950).`
      )
    for (const swatch of palette.swatches)
      opaque(swatch.value, `colorWall.${palette.id}.${swatch.stop}`)
  }
  object(options, 'colorPalette')
  keys(options, ['version', 'working', 'modes'], 'colorPalette')
  if (options.version !== undefined && options.version !== 1)
    throw new TypeError('Unsupported colorPalette.version; expected 1.')
  if (options.working !== undefined) {
    object(options.working, 'colorPalette.working')
    keys(options.working, workingRoles, 'colorPalette.working')
    for (const [role, id] of Object.entries(options.working))
      if (id !== undefined && typeof id !== 'string')
        throw new TypeError(`colorPalette.working.${role} must be a palette ID.`)
  }
  if (options.modes !== undefined) {
    object(options.modes, 'colorPalette.modes')
    keys(options.modes, modes, 'colorPalette.modes')
  }
  for (const mode of modes)
    if (options.modes?.[mode] !== undefined) {
      object(options.modes[mode], `colorPalette.modes.${mode}`)
      keys(options.modes[mode], [...colorRoles, 'canvas'], `colorPalette.modes.${mode}`)
      for (const [key, value] of Object.entries(options.modes[mode]))
        if (value !== undefined) opaque(value, `colorPalette.modes.${mode}.${key}`)
    }
  function palette(id: string): ThemePalette {
    const found = color.palettes!.find(p => p.id === id)
    if (!found)
      throw new TypeError(
        `Unknown working palette ID: ${String(id)}. Choose one of: ${color.palettes!.map(p => p.id).join(', ')}.`
      )
    return found
  }
  const primary = palette(options.working?.primary ?? 'brand')
  if (!Number.isFinite(wall.input.neutralHue) || !Number.isFinite(wall.input.hueAlignment))
    throw new TypeError('colorWall.input must contain finite neutralHue and hueAlignment controls.')
  const source = measureHex(color.brand.value)
  const sourceHue = source.C < 0.02 ? wall.input.neutralHue : source.h
  const nearest = colorFamilies.reduce((a, b) =>
    Math.abs(hueDifference(sourceHue, a[1])) < Math.abs(hueDifference(sourceHue, b[1])) ? a : b
  )
  const rotation = hueDifference(sourceHue, nearest[1]) * wall.input.hueAlignment
  function hueOf(p: ThemePalette) {
    const sample = measureHex(p.swatches[Math.floor(p.swatches.length / 2)].value)
    const nominal = colorFamilies.find(([name]) => name.toLowerCase() === p.id)
    return sample.C >= 0.02 ? sample.h : nominal ? nominal[1] + rotation : sourceHue
  }
  const hue = hueOf(primary)
  const supporting = color.palettes.filter(
    p => p.id !== 'brand' && p.id !== 'neutral' && p.id !== primary.id
  )
  if (!supporting.length) throw new TypeError('colorWall requires supporting hue families.')
  const support = supporting.reduce((a, b) => {
    return Math.abs(hueDifference(hueOf(a), hue + 120)) <=
      Math.abs(hueDifference(hueOf(b), hue + 120))
      ? a
      : b
  })
  const selected = {
    primary: primary.id,
    support: support.id,
    neutral: 'neutral',
    success: 'emerald',
    warning: 'amber',
    danger: 'red',
    ...Object.fromEntries(
      Object.entries(options.working ?? {}).filter(([, value]) => value !== undefined)
    )
  }
  for (const id of Object.values(selected)) palette(id)
  const working = {} as Record<
    WorkingPaletteRole,
    { paletteId: string; light: PaletteColorPair; dark: PaletteColorPair }
  >
  for (const role of workingRoles)
    working[role] = {
      paletteId: selected[role],
      light: { background: '', foreground: '' },
      dark: { background: '', foreground: '' }
    }
  const mapped = {} as Record<Mode, SharedTokens['color']>
  const canvases = {} as Record<Mode, { canvas: string }>
  const checks: PaletteContrastCheck[] = []
  for (const mode of modes) {
    const light = mode === 'light',
      override = options.modes?.[mode] ?? {}
    const neutrals = swatches(palette(selected.neutral))
    const canvas = override.canvas ?? neutrals[light ? 0 : neutrals.length - 1]
    const surface = override.surface ?? neutrals[light ? 1 : neutrals.length - 2]
    const backgrounds = [canvas, surface]
    const inks = [...neutrals, '#000000', '#FFFFFF']
    const foreground = override.foreground ?? choose(inks, backgrounds, 7, light ? 0.21 : 0.985)
    const muted = override.mutedForeground ?? choose(inks, backgrounds, 4.5, light ? 0.48 : 0.75)
    const fills: Record<WorkingPaletteRole, [string | undefined, string | undefined]> = {
      primary: [override.accent, override.accentForeground],
      neutral: [override.neutral, override.neutralForeground],
      warning: [override.warning, override.warningForeground],
      danger: [override.danger, override.dangerForeground],
      support: [undefined, undefined],
      success: [undefined, undefined]
    }
    for (const role of workingRoles) {
      working[role][mode] = pair(
        swatches(palette(selected[role])),
        inks,
        backgrounds,
        role === 'neutral' ? (light ? 0.93 : 0.43) : light ? 0.6 : 0.75,
        role === 'primary',
        ...fills[role]
      )
    }
    const colors: SharedTokens['color'] = {
      surface,
      foreground,
      mutedForeground: muted,
      placeholder: override.placeholder ?? muted,
      border: override.border ?? choose(neutrals, backgrounds, 3, light ? 0.65 : 0.6),
      focus: override.focus ?? choose(swatches(primary), backgrounds, 3, light ? 0.55 : 0.75),
      invalid:
        override.invalid ??
        choose(swatches(palette(selected.danger)), backgrounds, 4.5, light ? 0.5 : 0.75),
      disabledBackground: override.disabledBackground ?? neutrals[light ? 2 : neutrals.length - 3],
      disabledBorder: override.disabledBorder ?? neutrals[light ? 3 : neutrals.length - 4],
      accent: working.primary[mode].background,
      accentForeground: working.primary[mode].foreground,
      neutral: working.neutral[mode].background,
      neutralForeground: working.neutral[mode].foreground,
      warning: working.warning[mode].background,
      warningForeground: working.warning[mode].foreground,
      danger: working.danger[mode].background,
      dangerForeground: working.danger[mode].foreground
    }
    mapped[mode] = colors
    canvases[mode] = { canvas }
    const values: Record<string, string> = {
      ...colors,
      canvas,
      support: working.support[mode].background,
      supportForeground: working.support[mode].foreground,
      success: working.success[mode].background,
      successForeground: working.success[mode].foreground
    }
    function check(fg: string, bg: string, minimum: 3 | 4.5 | null) {
      const ratio = contrast(values[fg], values[bg]),
        pass = minimum === null ? null : ratio >= minimum
      checks.push({
        mode,
        foregroundRole: fg,
        backgroundRole: bg,
        foreground: values[fg],
        background: values[bg],
        ratio,
        minimum,
        pass,
        message:
          minimum === null
            ? 'Inactive controls are exempt from minimum contrast; this token-pair ratio excludes component opacity/effects.'
            : pass
              ? ''
              : `${fg} is ${ratio.toFixed(3)}:1 against ${bg}; requires ${minimum}:1 without rounding. Select another ${fg} shade or adjust ${bg}, then recheck the complete mode. The original brand and wall remain unchanged.`
      })
    }
    for (const background of ['canvas', 'surface']) {
      for (const foreground of ['foreground', 'mutedForeground', 'placeholder', 'invalid'])
        check(foreground, background, 4.5)
      for (const foreground of ['border', 'focus', 'accent']) check(foreground, background, 3)
    }
    for (const tone of ['accent', 'neutral', 'warning', 'danger', 'support', 'success'])
      check(tone + 'Foreground', tone, 4.5)
    check('mutedForeground', 'disabledBackground', null)
    check('disabledBorder', 'surface', null)
  }
  return freezeTree({
    version: 1 as const,
    working,
    color: { ...color, modes: mapped },
    surface: { modes: canvases },
    checks,
    pass: checks.every(c => c.pass !== false)
  })
}

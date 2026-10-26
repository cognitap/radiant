import { colorFamilies as families } from './colorFamilies.js'
import type {
  ThemeBrandSource,
  ThemeColorSection,
  ThemePalette
} from '../themes/themeDocumentTypes.js'
import { freezeTree } from '../themes/tokens.js'
import { clamp, hueDifference, measureHex, srgbMapper, wrapHue } from './oklch.js'

export type ColorCalibrationPreset = 'classic' | 'balanced' | 'expressive'
/** Stable IDs for independently choosing the full wall and exact-brand ramp. */
export const colorCalibrationPresets = freezeTree([
  {
    id: 'classic',
    name: 'Classic',
    description: 'Original hue-aware curves and linear anchor reshaping.'
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Restrained brand shades, coordinated families and smooth anchor reshaping.'
  },
  {
    id: 'expressive',
    name: 'Expressive',
    description: 'Fuller color families and a more vivid, smoothly reshaped brand ramp.'
  }
] as const)
const profiles = {
  classic: {
    center: 0.7,
    slope: 0.7,
    low: 0.6,
    high: 0.86,
    exponent: 1,
    cap: 0.255,
    envelope: 0.8,
    tint: 0.012,
    alignment: 0.6,
    radius: 2.2
  },
  balanced: {
    center: 0.7,
    slope: 0.75,
    low: 0.62,
    high: 0.9,
    exponent: 0.95,
    cap: 0.26,
    envelope: 0.4,
    tint: 0.008,
    alignment: 0.25,
    radius: 2.2
  },
  expressive: {
    center: 0.62,
    slope: 0.9,
    low: 0.6,
    high: 0.92,
    exponent: 1.05,
    cap: 0.32,
    envelope: 0.3,
    tint: 0.016,
    alignment: 0.5,
    radius: 2.6
  }
} as const

export interface ColorWallInput {
  readonly version?: 1
  /** Original opaque six-digit sRGB hex; retained verbatim at the exact anchor. */
  readonly brand: string
  readonly gamut?: 'srgb'
  readonly fidelity?: 'anchored' | 'unanchored'
  /** Independently select coordinated families and the brand ramp. Both default to balanced. */
  readonly wallPreset?: ColorCalibrationPreset
  readonly rampPreset?: ColorCalibrationPreset
  /** 0–1 wall chroma. Omit to derive restraint from the source. */
  readonly vividness?: number
  /** 0–1 brand-ramp chroma, independent of wall vividness; never changes the exact anchor. */
  readonly brandVividness?: number
  readonly lightness?: 'hue-aware' | 'shared'
  /** 0.75–1.35. */
  readonly distribution?: number
  /** 0–0.035 peak OKLCH chroma. */
  readonly neutralTint?: number
  /** 0–1 alignment of the nearest named hue family toward the brand. */
  readonly hueAlignment?: number
  /** Finite degrees, wrapped to [0, 360); used when source C < 0.02. */
  readonly neutralHue?: number
}
export interface ColorWall {
  /** Materialised, JSON-safe inputs; replay with generateColorWall(wall.input). */
  readonly input: Required<ColorWallInput>
  readonly neutralInput: boolean
  /** Color authoring data; semantic values and modes remain independently owned. */
  readonly color: {
    readonly brand: ThemeBrandSource
    readonly fidelity: 'anchored' | 'unanchored'
    readonly palettes: readonly ThemePalette[]
    readonly anchor?: ThemeColorSection['anchor']
  }
}

const stops = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
const lightness = [0.985, 0.965, 0.93, 0.87, 0.79, 0.7, 0.61, 0.52, 0.43, 0.34, 0.24]

function option<T>(value: unknown, fallback: T, allowed: readonly T[], key: string): T {
  if (value === undefined) return fallback
  if (!allowed.includes(value as T))
    throw new TypeError(`colorWall.${key} must be one of: ${allowed.join(', ')}.`)
  return value as T
}
function number(value: unknown, fallback: number, low: number, high: number, key: string): number {
  if (value === undefined) return fallback
  if (typeof value !== 'number' || !Number.isFinite(value) || value < low || value > high) {
    throw new TypeError(`colorWall.${key} must be a finite number from ${low} to ${high}.`)
  }
  return value === 0 ? 0 : value
}

/** Three-point monotone Hermite mapping; endpoints also cover exact black/white. */
function reshapeLightness(
  x0: number,
  x1: number,
  x2: number,
  y0: number,
  y1: number,
  y2: number,
  x: number,
  endpoint: boolean
) {
  if (endpoint) return y0 + ((x - x0) / (x2 - x0)) * (y2 - y0)
  const h0 = x1 - x0,
    h1 = x2 - x1
  const d0 = (y1 - y0) / h0,
    d1 = (y2 - y1) / h1
  const m0 = clamp(((2 * h0 + h1) * d0 - h0 * d1) / (h0 + h1), 0, 3 * d0)
  const m2 = clamp(((2 * h1 + h0) * d1 - h1 * d0) / (h0 + h1), 0, 3 * d1)
  const w1 = 2 * h1 + h0,
    w2 = h1 + 2 * h0
  const m1 = d0 <= 0 || d1 <= 0 ? 0 : (w1 + w2) / (w1 / d0 + w2 / d1)
  const upper = x > x1
  const lo = upper ? x1 : x0,
    hi = upper ? x2 : x1
  const a = upper ? y1 : y0,
    b = upper ? y2 : y1
  const ma = upper ? m1 : m0,
    mb = upper ? m2 : m1
  const t = clamp((x - lo) / (hi - lo)),
    span = hi - lo
  return (
    (2 * t ** 3 - 3 * t ** 2 + 1) * a +
    (t ** 3 - 2 * t ** 2 + t) * span * ma +
    (-2 * t ** 3 + 3 * t ** 2) * b +
    (t ** 3 - t ** 2) * span * mb
  )
}

/** Deterministic, sRGB-first calibration v1. No browser, React, AI or semantic-role selection. */
export function generateColorWall(input: ColorWallInput): ColorWall {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new TypeError('colorWall input must be an object.')
  const allowed = [
    'version',
    'brand',
    'gamut',
    'fidelity',
    'wallPreset',
    'rampPreset',
    'vividness',
    'brandVividness',
    'lightness',
    'distribution',
    'neutralTint',
    'hueAlignment',
    'neutralHue'
  ]
  for (const key of Object.keys(input)) {
    if (!allowed.includes(key)) throw new TypeError(`Unknown colorWall input: ${key}.`)
  }
  if (typeof input.brand !== 'string' || !/^#[0-9a-f]{6}$/i.test(input.brand)) {
    throw new TypeError(
      'colorWall.brand must be an opaque six-digit sRGB hex color, such as #7C3AED. Alpha and wide-gamut sources are not supported by version 1.'
    )
  }
  const source = measureHex(input.brand),
    mapper = srgbMapper()
  const neutralInput = source.C < 0.02
  const wallPreset = option(
    input.wallPreset,
    'balanced',
    ['classic', 'balanced', 'expressive'] as const,
    'wallPreset'
  )
  const rampPreset = option(
    input.rampPreset,
    'balanced',
    ['classic', 'balanced', 'expressive'] as const,
    'rampPreset'
  )
  const wallProfile = profiles[wallPreset],
    brandProfile = profiles[rampPreset]
  const mood = Math.sqrt(clamp(source.C / 0.28))
  const classicVividness = neutralInput
    ? 0.35
    : clamp(source.C / Math.max(0.001, mapper.maxChroma(source.L, source.h)), 0.1, 0.92)
  const settings: Required<ColorWallInput> = {
    version: option(input.version, 1, [1], 'version'),
    brand: input.brand,
    gamut: option(input.gamut, 'srgb', ['srgb'], 'gamut'),
    fidelity: option(input.fidelity, 'anchored', ['anchored', 'unanchored'], 'fidelity'),
    wallPreset,
    rampPreset,
    vividness: number(
      input.vividness,
      wallPreset === 'classic'
        ? classicVividness
        : wallPreset === 'balanced'
          ? 0.45 + 0.4 * mood
          : 0.6 + 0.3 * mood,
      0,
      1,
      'vividness'
    ),
    brandVividness: number(
      input.brandVividness,
      rampPreset === 'classic'
        ? classicVividness
        : rampPreset === 'balanced'
          ? 0.18 + 0.65 * mood
          : 0.28 + 0.62 * mood,
      0,
      1,
      'brandVividness'
    ),
    lightness: option(input.lightness, 'hue-aware', ['hue-aware', 'shared'], 'lightness'),
    distribution: number(input.distribution, 1, 0.75, 1.35, 'distribution'),
    neutralTint: number(input.neutralTint, wallProfile.tint, 0, 0.035, 'neutralTint'),
    hueAlignment: number(input.hueAlignment, wallProfile.alignment, 0, 1, 'hueAlignment'),
    neutralHue: wrapHue(
      number(input.neutralHue, 255, -Number.MAX_VALUE, Number.MAX_VALUE, 'neutralHue')
    )
  }
  const hue = neutralInput ? settings.neutralHue : source.h
  const nearestFamily = families.reduce((a, b) =>
    Math.abs(hueDifference(hue, a[1])) < Math.abs(hueDifference(hue, b[1])) ? a : b
  )
  const rotation = hueDifference(hue, nearestFamily[1]) * settings.hueAlignment
  function tone(
    base: number,
    h: number,
    profile: (typeof profiles)[ColorCalibrationPreset]
  ): number {
    const middle =
      settings.lightness === 'shared'
        ? 0.7
        : clamp(
            profile.center + profile.slope * (mapper.cuspLightness(h) - profile.center),
            profile.low,
            profile.high
          )
    return base >= 0.7
      ? middle +
          (0.985 - middle) *
            ((base - 0.7) / (0.985 - 0.7)) ** (settings.distribution * profile.exponent)
      : middle -
          (middle - 0.24) *
            ((0.7 - base) / (0.7 - 0.24)) ** (settings.distribution * profile.exponent)
  }
  function ramp(
    h: number,
    kind: 'chromatic' | 'neutral' | 'achromatic',
    profile = wallProfile,
    strength = settings.vividness
  ) {
    return lightness.map((base, i) => {
      const L = kind === 'chromatic' ? tone(base, h, profile) : base
      const envelope = Math.sin(Math.PI * (1 - L))
      const C =
        kind === 'neutral'
          ? settings.neutralTint * envelope ** 0.8
          : kind === 'achromatic'
            ? 0
            : Math.min(
                mapper.maxChroma(L, h) * strength,
                profile.cap * envelope ** profile.envelope
              )
      return { ...mapper.map(L, C, h), stop: stops[i] }
    })
  }
  const regular = ramp(
    hue,
    neutralInput ? 'achromatic' : 'chromatic',
    brandProfile,
    settings.brandVividness
  )
  const closest = regular.reduce((a, b) =>
    Math.abs(a.L - source.L) <= Math.abs(b.L - source.L) ? a : b
  )
  const anchor = regular.indexOf(closest)
  const brand = regular.map((color, i) => {
    if (settings.fidelity === 'unanchored') return color
    if (i === anchor) return { ...source, stop: stops[i] }
    const top = Math.max(regular[0].L, source.L),
      bottom = Math.min(regular.at(-1)!.L, source.L)
    const L =
      settings.rampPreset === 'classic'
        ? i < anchor
          ? source.L + ((top - source.L) * (color.L - closest.L)) / (regular[0].L - closest.L)
          : source.L -
            ((source.L - bottom) * (closest.L - color.L)) / (closest.L - regular.at(-1)!.L)
        : reshapeLightness(
            regular.at(-1)!.L,
            closest.L,
            regular[0].L,
            bottom,
            source.L,
            top,
            color.L,
            anchor === 0 || anchor === regular.length - 1
          )
    const weight = Math.exp(-(((i - anchor) / brandProfile.radius) ** 2))
    const C =
      settings.rampPreset === 'classic'
        ? Math.max(0, color.C + (source.C - closest.C) * weight)
        : neutralInput
          ? 0
          : mapper.maxChroma(L, hue) *
            clamp(
              (color.C / Math.max(0.001, mapper.maxChroma(color.L, hue))) * (1 - weight) +
                (source.C / Math.max(0.001, mapper.maxChroma(source.L, hue))) * weight
            )
    return { ...mapper.map(L, C, hue), stop: color.stop }
  })
  function palette(name: string, colors: typeof regular): ThemePalette {
    return {
      id: name.toLowerCase(),
      name,
      swatches: colors.map(({ stop, value }) => ({ stop, value }))
    }
  }
  return freezeTree({
    input: settings,
    neutralInput,
    color: {
      brand: { value: input.brand, gamut: 'srgb' as const },
      fidelity: settings.fidelity,
      ...(settings.fidelity === 'anchored'
        ? { anchor: { paletteId: 'brand', stop: stops[anchor] } }
        : {}),
      palettes: [
        palette('Brand', brand),
        ...families.map(([name, h]) => palette(name, ramp(wrapHue(h + rotation), 'chromatic'))),
        palette('Neutral', ramp(hue, 'neutral'))
      ]
    }
  })
}

import type {
  ThemeBrandSource,
  ThemeColorSection,
  ThemePalette
} from '../themes/themeDocumentTypes.js'
import { freezeTree } from '../themes/tokens.js'
import { clamp, hueDifference, measureHex, srgbMapper, wrapHue } from './oklch.js'

export interface ColorWallInput {
  readonly version?: 1
  /** Original opaque six-digit sRGB hex; retained verbatim at the exact anchor. */
  readonly brand: string
  readonly gamut?: 'srgb'
  readonly fidelity?: 'anchored' | 'unanchored'
  /** 0–1. Omit to derive restraint from the source. */
  readonly vividness?: number
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
const families = [
  ['Red', 25],
  ['Orange', 55],
  ['Amber', 80],
  ['Yellow', 100],
  ['Lime', 125],
  ['Green', 145],
  ['Emerald', 165],
  ['Teal', 185],
  ['Cyan', 205],
  ['Sky', 230],
  ['Blue', 255],
  ['Indigo', 275],
  ['Violet', 295],
  ['Purple', 315],
  ['Pink', 340],
  ['Rose', 10]
] as const

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

/** Deterministic, sRGB-first calibration v1. No browser, React, AI or semantic-role selection. */
export function generateColorWall(input: ColorWallInput): ColorWall {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new TypeError('colorWall input must be an object.')
  const allowed = [
    'version',
    'brand',
    'gamut',
    'fidelity',
    'vividness',
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
  const derivedVividness = neutralInput
    ? 0.35
    : clamp(source.C / Math.max(0.001, mapper.maxChroma(source.L, source.h)), 0.1, 0.92)
  const settings: Required<ColorWallInput> = {
    version: option(input.version, 1, [1], 'version'),
    brand: input.brand,
    gamut: option(input.gamut, 'srgb', ['srgb'], 'gamut'),
    fidelity: option(input.fidelity, 'anchored', ['anchored', 'unanchored'], 'fidelity'),
    vividness: number(input.vividness, derivedVividness, 0, 1, 'vividness'),
    lightness: option(input.lightness, 'hue-aware', ['hue-aware', 'shared'], 'lightness'),
    distribution: number(input.distribution, 1, 0.75, 1.35, 'distribution'),
    neutralTint: number(input.neutralTint, 0.012, 0, 0.035, 'neutralTint'),
    hueAlignment: number(input.hueAlignment, 0.6, 0, 1, 'hueAlignment'),
    neutralHue: wrapHue(
      number(input.neutralHue, 255, -Number.MAX_VALUE, Number.MAX_VALUE, 'neutralHue')
    )
  }
  const hue = neutralInput ? settings.neutralHue : source.h
  const nearestFamily = families.reduce((a, b) =>
    Math.abs(hueDifference(hue, a[1])) < Math.abs(hueDifference(hue, b[1])) ? a : b
  )
  const rotation = hueDifference(hue, nearestFamily[1]) * settings.hueAlignment
  function tone(base: number, h: number): number {
    const middle =
      settings.lightness === 'shared'
        ? 0.7
        : clamp(0.7 + 0.7 * (mapper.cuspLightness(h) - 0.7), 0.6, 0.86)
    return base >= 0.7
      ? middle + (0.985 - middle) * ((base - 0.7) / (0.985 - 0.7)) ** settings.distribution
      : middle - (middle - 0.24) * ((0.7 - base) / (0.7 - 0.24)) ** settings.distribution
  }
  function ramp(h: number, kind: 'chromatic' | 'neutral' | 'achromatic') {
    return lightness.map((base, i) => {
      const L = kind === 'chromatic' ? tone(base, h) : base
      const envelope = Math.sin(Math.PI * (1 - L)) ** 0.8
      const C =
        kind === 'neutral'
          ? settings.neutralTint * envelope
          : kind === 'achromatic'
            ? 0
            : Math.min(mapper.maxChroma(L, h) * settings.vividness, 0.255 * envelope)
      return { ...mapper.map(L, C, h), stop: stops[i] }
    })
  }
  const regular = ramp(hue, neutralInput ? 'achromatic' : 'chromatic')
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
      i < anchor
        ? source.L + ((top - source.L) * (color.L - closest.L)) / (regular[0].L - closest.L)
        : source.L - ((source.L - bottom) * (closest.L - color.L)) / (closest.L - regular.at(-1)!.L)
    const C = Math.max(0, color.C + (source.C - closest.C) * Math.exp(-(((i - anchor) / 2.2) ** 2)))
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

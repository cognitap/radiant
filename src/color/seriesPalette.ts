import type { SeriesIndex } from '../themes/tokens.js'
import { freezeTree, tokenDefaults } from '../themes/tokens.js'
import { parseColor } from './colorValue.js'
import { clamp, linearRgb, measureHex, srgbMapper } from './oklch.js'
import type { ColorPalette } from './recommendColorPalette.js'

type Mode = 'light' | 'dark'
type Lab = readonly [number, number, number]
type Matrix = readonly [Lab, Lab, Lab]
export type SeriesSolids = Readonly<Record<SeriesIndex, { readonly solid: string }>>
export type SeriesVision = 'typical' | 'protanopia' | 'deuteranopia' | 'tritanopia'
/** The weakest contrast and the closest pair of solids in one mode. */
export interface SeriesPaletteCheck {
  readonly pass: boolean
  readonly contrast: {
    readonly series: SeriesIndex
    readonly pair: 'solid on surface' | 'solid on canvas' | 'text on soft'
    readonly ratio: number
    readonly minimum: 3 | 4.5
  }
  readonly distance: {
    readonly series: readonly [SeriesIndex, SeriesIndex]
    readonly vision: SeriesVision
    /** Oklab distance after simulating `vision`. */
    readonly distance: number
    readonly minimum: number
  }
}
export interface SeriesPalette {
  readonly light: SeriesSolids
  readonly dark: SeriesSolids
  readonly checks: { readonly light: SeriesPaletteCheck; readonly dark: SeriesPaletteCheck }
  readonly pass: boolean
}

const minimumDistance = 0.08
const maximumSteps = 40
const stepSize = 0.005
// Machado, Oliveira and Fernandes (2009) full-severity matrices, applied in linear sRGB.
const visions: readonly (readonly [SeriesVision, Matrix | null])[] = [
  ['typical', null],
  [
    'protanopia',
    [
      [0.152286, 1.052583, -0.204868],
      [0.114503, 0.786281, 0.099216],
      [-0.003882, -0.048116, 1.051998]
    ]
  ],
  [
    'deuteranopia',
    [
      [0.367322, 0.860646, -0.227968],
      [0.280085, 0.672501, 0.047413],
      [-0.01182, 0.04294, 0.968881]
    ]
  ],
  [
    'tritanopia',
    [
      [1.255528, -0.076749, -0.178779],
      [-0.078411, 0.930809, 0.147602],
      [0.004733, 0.691367, 0.3039]
    ]
  ]
]

const lab = (L: number, C: number, h: number): Lab => {
  const angle = (h * Math.PI) / 180
  return [L, C * Math.cos(angle), C * Math.sin(angle)]
}
const hexLab = (hex: string) => {
  const { L, C, h } = measureHex(hex)
  return lab(L, C, h)
}
const mix = (x: Lab, y: Lab, weight: number): Lab =>
  [0, 1, 2].map(i => x[i] * weight + y[i] * (1 - weight)) as unknown as Lab
const toLinear = ([L, a, b]: Lab): Lab =>
  linearRgb(L, Math.hypot(a, b), (Math.atan2(b, a) * 180) / Math.PI).map(n =>
    clamp(n)
  ) as unknown as Lab
function toLab([r, g, b]: Lab): Lab {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  ]
}
const simulate = (value: Lab, matrix: Matrix) => {
  const rgb = toLinear(value)
  return toLab(
    matrix.map(row => clamp(row.reduce((sum, k, i) => sum + k * rgb[i], 0))) as unknown as Lab
  )
}
function luminance(value: Lab) {
  const [r, g, b] = toLinear(value)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function contrast(x: Lab, y: Lab) {
  const [high, low] = [luminance(x), luminance(y)].sort((a, b) => b - a)
  return (high + 0.05) / (low + 0.05)
}

type Candidate = readonly (readonly [SeriesIndex, string, Lab])[]

/**
 * Series solids for a generated palette, with checks against its surface, canvas and foreground:
 * solids reach 3:1 on the surface and canvas, series text reaches 4.5:1 on its soft fill, and every
 * pair of solids stays 0.08 apart in Oklab under typical vision and simulated protanopia,
 * deuteranopia and tritanopia.
 *
 * Each mode keeps the default solids when they pass. Otherwise it tries up to 40 lightness steps of
 * 0.005 away from the surface, moving all eight together or each only as far as its own contrast
 * needs, and takes the first that passes. When none passes it returns the closest attempt with
 * `pass: false` and the failing contrast or pair in `checks`; it never throws.
 */
export function seriesPalette(palette: ColorPalette): SeriesPalette {
  const gamut = srgbMapper()
  const mode = (mode: Mode) => {
    const surface = hexLab(palette.color.modes[mode].surface),
      foreground = hexLab(palette.color.modes[mode].foreground),
      canvas = hexLab(palette.surface.modes[mode].canvas),
      direction = mode === 'light' ? -1 : 1,
      defaults = Object.entries(tokenDefaults[mode].series).map(
        ([name, { solid }]) => [name as SeriesIndex, solid, parseColor(solid)!] as const
      )
    const contrasts = (solid: Lab) =>
      [
        ['solid on surface', contrast(solid, surface), 3],
        ['solid on canvas', contrast(solid, canvas), 3],
        ['text on soft', contrast(mix(solid, foreground, 0.55), mix(solid, surface, 0.14)), 4.5]
      ] as const
    const shifted = (steps: (index: number) => number): Candidate =>
      defaults.map(([name, solid, { L, C, h }], index) => {
        const step = steps(index)
        if (step === 0) return [name, solid, lab(L, C, h)]
        const lightness = Number(clamp(L + direction * step * stepSize).toFixed(3)),
          chroma = Math.floor(Math.min(C, gamut.maxChroma(lightness, h)) * 1000) / 1000
        return [name, `oklch(${lightness} ${chroma} ${h})`, lab(lightness, chroma, h)]
      })
    function check(candidate: Candidate): SeriesPaletteCheck & { score: number } {
      let worstContrast: SeriesPaletteCheck['contrast'] | undefined,
        worstDistance: SeriesPaletteCheck['distance'] | undefined
      for (const [series, , solid] of candidate)
        for (const [pair, ratio, minimum] of contrasts(solid))
          if (!worstContrast || ratio / minimum < worstContrast.ratio / worstContrast.minimum)
            worstContrast = { series, pair, ratio, minimum }
      for (const [vision, matrix] of visions) {
        const seen = candidate.map(([, , solid]) => (matrix ? simulate(solid, matrix) : solid))
        for (let a = 0; a < seen.length; a++)
          for (let b = a + 1; b < seen.length; b++) {
            const distance = Math.hypot(...seen[a].map((channel, i) => channel - seen[b][i]))
            if (!worstDistance || distance < worstDistance.distance)
              worstDistance = {
                series: [candidate[a][0], candidate[b][0]],
                vision,
                distance,
                minimum: minimumDistance
              }
          }
      }
      const score = Math.min(
        worstContrast!.ratio / worstContrast!.minimum,
        worstDistance!.distance / minimumDistance
      )
      return { pass: score >= 1, contrast: worstContrast!, distance: worstDistance!, score }
    }
    // The steps each series needs for its own contrast, or the cap when it never gets there.
    const needs = defaults.map((_, index) => {
      for (let step = 0; step <= maximumSteps; step++) {
        const [, , solid] = shifted(i => (i === index ? step : 0))[index]
        if (contrasts(solid).every(([, ratio, minimum]) => ratio >= minimum)) return step
      }
      return maximumSteps
    })
    let best: { candidate: Candidate; result: ReturnType<typeof check> } | undefined
    search: for (let step = 0; step <= maximumSteps; step++)
      for (const candidate of [
        shifted(() => step),
        shifted(index => Math.min(step, needs[index]))
      ]) {
        const result = check(candidate)
        if (!best || result.score > best.result.score) best = { candidate, result }
        if (result.pass) break search
      }
    const { candidate, result } = best!
    const { score: _score, ...summary } = result
    return {
      solids: Object.fromEntries(
        candidate.map(([name, solid]) => [name, { solid }])
      ) as unknown as SeriesSolids,
      check: summary
    }
  }
  const light = mode('light'),
    dark = mode('dark')
  return freezeTree({
    light: light.solids,
    dark: dark.solids,
    checks: { light: light.check, dark: dark.check },
    pass: light.check.pass && dark.check.pass
  })
}

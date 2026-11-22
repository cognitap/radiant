import type { SeriesIndex } from '../themes/tokens.js'
import { freezeTree, tokenDefaults } from '../themes/tokens.js'
import { parseColor } from './colorValue.js'
import { clamp, linearRgb, measureHex, srgbMapper } from './oklch.js'
import type { ColorPalette } from './recommendColorPalette.js'

type Mode = 'light' | 'dark'
type Lab = readonly [number, number, number]
export type SeriesSolids = Readonly<Record<SeriesIndex, { readonly solid: string }>>

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
function luminance([L, a, b]: Lab) {
  const [r, g, blue] = linearRgb(L, Math.hypot(a, b), (Math.atan2(b, a) * 180) / Math.PI).map(n =>
    clamp(n)
  )
  return 0.2126 * r + 0.7152 * g + 0.0722 * blue
}
function contrast(x: Lab, y: Lab) {
  const [high, low] = [luminance(x), luminance(y)].sort((a, b) => b - a)
  return (high + 0.05) / (low + 0.05)
}

/**
 * The default series solids, all moved away from the surface by the smallest shared lightness step
 * that gives 3:1 on the palette's surface and canvas and 4.5:1 for series text on its soft fill.
 * A shared step keeps the lightness gaps that tell the series apart.
 */
export function seriesPalette(palette: ColorPalette): { light: SeriesSolids; dark: SeriesSolids } {
  const gamut = srgbMapper()
  const mode = (mode: Mode) => {
    const surface = hexLab(palette.color.modes[mode].surface),
      foreground = hexLab(palette.color.modes[mode].foreground),
      canvas = hexLab(palette.surface.modes[mode].canvas),
      direction = mode === 'light' ? -1 : 1,
      defaults = Object.entries(tokenDefaults[mode].series).map(
        ([name, { solid }]) => [name, solid, parseColor(solid)!] as const
      )
    const passes = (solid: Lab) =>
      contrast(solid, surface) >= 3 &&
      contrast(solid, canvas) >= 3 &&
      contrast(mix(solid, foreground, 0.55), mix(solid, surface, 0.14)) >= 4.5
    let solids = defaults.map(([name, solid, { L, C, h }]) => [name, solid, lab(L, C, h)] as const)
    for (let step = 1; step <= 40 && !solids.every(([, , value]) => passes(value)); step++)
      solids = defaults.map(([name, , { L, C, h }]) => {
        const lightness = Number(clamp(L + direction * step * 0.005).toFixed(3)),
          chroma = Math.floor(Math.min(C, gamut.maxChroma(lightness, h)) * 1000) / 1000
        return [name, `oklch(${lightness} ${chroma} ${h})`, lab(lightness, chroma, h)] as const
      })
    return Object.fromEntries(
      solids.map(([name, solid]) => [name, { solid }])
    ) as unknown as SeriesSolids
  }
  return freezeTree({ light: mode('light'), dark: mode('dark') })
}

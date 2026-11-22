import type { ColorPalette } from '../color/recommendColorPalette.js'
import { seriesPalette } from '../color/seriesPalette.js'
type ChartSeriesColors = Record<`series${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`, string>
/**
 * @deprecated Charts read the series tokens. Set `seriesPalette(palette)` as `tokens.series` in
 * each mode instead, so tags and highlights share the chart colours.
 */
export function chartPalette(palette: ColorPalette): {
  light: ChartSeriesColors
  dark: ChartSeriesColors
} {
  const series = seriesPalette(palette)
  const mode = (mode: 'light' | 'dark') =>
    Object.fromEntries(
      Object.entries(series[mode]).map(([name, { solid }]) => [`series${name}`, solid])
    ) as ChartSeriesColors
  return { light: mode('light'), dark: mode('dark') }
}

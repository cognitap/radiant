import { createRef } from 'react'
import {
  LineChart,
  BarChart,
  AreaChart,
  PieChart,
  ChartDataTable,
  chartPalette,
  type ChartDatum
} from '../../src/charts/index.js'
import { defineTheme } from '../../src/index.js'
import { generateColorWall, recommendColorPalette } from '../../src/color/index.js'
const data: ChartDatum[] = [
    { key: 'one', label: 'Round 1', values: { sessions: 12 } },
    { key: 'two', label: 'Round 2', values: { sessions: 24 } }
  ],
  series = [{ key: 'sessions', label: 'Sessions' }]
export const charts = (
  <>
    <LineChart
      ref={createRef<HTMLElement>()}
      label="Sessions"
      data={data}
      series={series}
      parts={{ point: { className: 'outline' }, plot: { style: { height: '24rem' } } }}
    />
    <BarChart
      label="Sessions"
      data={data}
      series={series}
    />
    <AreaChart
      label="Sessions"
      data={data}
      series={series}
    />
    <PieChart
      label="Methods"
      data={data}
      series={[series[0]!]}
    />
    <ChartDataTable
      ref={createRef<HTMLTableElement>()}
      label="Counts"
      data={data}
      series={series}
    />
  </>
)
const palette = chartPalette(recommendColorPalette(generateColorWall({ brand: '#7c3aed' })))
export const theme = defineTheme({
  id: 'charts',
  name: 'Charts',
  components: { chart: { height: '20rem', strokeWidth: '3', gap: '1rem' } },
  modes: {
    light: { components: { chart: palette.light } },
    dark: { components: { chart: palette.dark } }
  }
})
// @ts-expect-error Charts require a visible label.
export const unnamed = (
  <LineChart
    data={data}
    series={series}
  />
)
// @ts-expect-error Pie has one numeric series.
export const ambiguous = (
  <PieChart
    label="Methods"
    data={data}
    series={series}
  />
)
// @ts-expect-error The figure's native name belongs to its caption.
export const differentName = (
  <LineChart
    aria-label="Different"
    label="Sessions"
    data={data}
    series={series}
  />
)

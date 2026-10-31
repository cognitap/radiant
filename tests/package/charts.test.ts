import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as core from '@cognitap/radiant'
import {
  LineChart,
  BarChart,
  AreaChart,
  PieChart,
  ChartDataTable,
  chartPalette
} from '@cognitap/radiant/charts'
import { generateColorWall, recommendColorPalette } from '@cognitap/radiant/color'
const data = [
    { key: 'one', label: 'Round 1', values: { sessions: 12 } },
    { key: 'two', label: 'Round 2', values: { sessions: 24 } }
  ],
  series = [{ key: 'sessions', label: 'Sessions' }]
test('the optional Charts entry renders labeled figures, real Tooltip Buttons and native data tables on the server', () => {
  for (const Chart of [LineChart, BarChart, AreaChart]) {
    const html = renderToStaticMarkup(h(Chart, { label: 'Sessions', data, series }))
    assert.match(html, /<figure/)
    assert.match(html, /<figcaption[^>]*>Sessions/)
    assert.match(html, /<table/)
    assert.match(html, /<caption[^>]*>Sessions data/)
    assert.match(html, /aria-label="Round 1, Sessions: 12"/)
    assert.match(html, /chart-point/)
    assert.doesNotMatch(html, /NaN|Infinity/)
  }
  const pie = renderToStaticMarkup(h(PieChart, { label: 'Methods', data, series: [series[0]!] }))
  assert.match(pie, /data-kind="pie"/)
  assert.equal('LineChart' in core, false)
  const table = renderToStaticMarkup(h(ChartDataTable, { label: 'Counts', data, series }))
  assert.match(table, /data-slot="table chart-data-table"/)
})
test('palette colors map deterministically without adding a charting-engine dependency', () => {
  const palette = recommendColorPalette(generateColorWall({ brand: '#7c3aed' })),
    first = chartPalette(palette),
    second = chartPalette(palette)
  assert.deepEqual(first, second)
  assert.equal(Object.keys(first.light).length, 6)
  assert.notDeepEqual(first.light, first.dark)
  assert.throws(
    () =>
      renderToStaticMarkup(
        h(PieChart, {
          label: 'Invalid',
          data: [{ key: 'bad', label: 'Bad', values: { sessions: -1 } }],
          series: [series[0]!]
        })
      ),
    /nonnegative/
  )
  assert.throws(
    () => renderToStaticMarkup(h(LineChart, { label: 'Invalid', data, series: [] })),
    /one to six/
  )
})

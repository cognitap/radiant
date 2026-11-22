import { act, createRef, StrictMode } from 'react'
import { expect, test, vi } from 'vitest'
import { commands } from 'vitest/browser'
import {
  LineChart,
  BarChart,
  AreaChart,
  PieChart,
  ChartDataTable,
  type ChartProps
} from '../../src/charts/index.js'
import { ThemeScope, defineTheme } from '../../src/index.js'
import { themes } from '../../src/examples/index.js'
import { generateColorWall, recommendColorPalette, seriesPalette } from '../../src/color/index.js'
import { mount, click, key } from './familyHarness.js'
const data = [
    { key: 'one', label: 'Round 1', values: { completed: 12, scheduled: 18 } },
    { key: 'two', label: 'Round 2', values: { completed: 24, scheduled: 30 } }
  ],
  series = [
    { key: 'completed', label: 'Completed' },
    { key: 'scheduled', label: 'Scheduled' }
  ]
const points = (host: ParentNode) =>
  Array.from(host.querySelectorAll<HTMLButtonElement>('[data-slot~="chart-point"]'))
function Sample(props: Partial<ChartProps>) {
  return (
    <LineChart
      label="Research sessions"
      description="Compare research rounds."
      data={data}
      series={series}
      {...props}
    />
  )
}
test('SSR hydration preserves actual figure refs, labels, native Table alternatives and typed themes', async () => {
  const ref = createRef<HTMLElement>(),
    { host } = await mount(
      <StrictMode>
        <Sample
          ref={ref}
          className="outline"
          style={{ '--rad-chart-height': '24rem' }}
        />
      </StrictMode>,
      true
    )
  expect(ref.current?.tagName).toBe('FIGURE')
  expect(ref.current?.classList.contains('outline')).toBe(true)
  expect(ref.current).toHaveAccessibleName('Research sessions')
  expect(ref.current).toHaveAccessibleDescription('Compare research rounds.')
  expect(host.querySelector('table')?.tagName).toBe('TABLE')
  expect(host.querySelector('thead th')?.textContent).toBe('Category')
  expect(
    getComputedStyle(
      host.querySelector<HTMLElement>('[data-slot~="scroll-area-content"]')
        ?.firstElementChild as HTMLElement
    ).height
  ).toBe('384px')
})
test('real Tooltip Buttons are reachable with one tab stop and move through values with arrow keys', async () => {
  const { host } = await mount(<Sample />),
    buttons = points(host)
  expect(buttons.filter(button => button.tabIndex === 0).length).toBe(1)
  await act(async () => buttons[0]!.focus())
  await vi.waitFor(() =>
    expect(host.querySelector<HTMLElement>('[role="tooltip"]')?.matches(':popover-open')).toBe(true)
  )
  expect(buttons[0]).toHaveAccessibleName('Round 1, Completed: 12')
  await key('{ArrowRight}')
  expect(document.activeElement).toBe(buttons[1])
  await key('{End}')
  expect(document.activeElement).toBe(buttons.at(-1))
  await key('{Home}')
  expect(document.activeElement).toBe(buttons[0])
  await key('{Escape}')
  await vi.waitFor(() =>
    expect(host.querySelector<HTMLElement>('[role="tooltip"]')?.matches(':popover-open')).toBe(
      false
    )
  )
})
test('data table disclosure exposes exact values, custom labels and formatted tooltips', async () => {
  const { host } = await mount(
    <Sample
      formatValue={value => `${value} sessions`}
      tableLabel="Inspect exact counts"
      categoryLabel="Research round"
    />
  )
  const details = host.querySelector('details')!
  expect(details.open).toBe(false)
  await click(host.querySelector('summary')!)
  expect(details.open).toBe(true)
  expect(host.querySelector('caption')?.textContent).toBe('Research sessions')
  expect(host.querySelector('tbody')?.textContent).toContain('12 sessions')
  expect(host.querySelector('thead')?.textContent).toContain('Research round')
  expect(points(host)[0]).toHaveAccessibleName('Round 1, Completed: 12 sessions')
})
test('bar, area and pie render finite geometry and keep the same native alternatives', async () => {
  for (const Chart of [BarChart, AreaChart]) {
    const { host } = await mount(
      <Chart
        label="Research"
        data={data}
        series={series}
      />
    )
    expect(points(host).length).toBe(4)
    expect(host.innerHTML).not.toMatch(/NaN|Infinity/)
    expect(host.querySelector('table')).not.toBeNull()
  }
  const { host } = await mount(
    <PieChart
      label="Methods"
      data={data}
      series={[series[0]!]}
    />
  )
  expect(points(host).length).toBe(2)
  expect(host.querySelectorAll('svg path').length).toBe(2)
  expect(host.querySelector('ul')?.textContent).toContain('Round 1')
})
test('RTL point navigation, reduced motion and forced colors retain the value inspection path', async () => {
  await act(async () =>
    commands.emulatePreferences({ reducedMotion: 'reduce', forcedColors: 'active' })
  )
  const { host } = await mount(<Sample dir="rtl" />),
    buttons = points(host)
  await act(async () => buttons[0]!.focus())
  await key('{ArrowLeft}')
  expect(document.activeElement).toBe(buttons[1])
  expect(getComputedStyle(host.querySelector('svg path')!).stroke).not.toBe('none')
  expect(host.querySelector('table')).not.toBeNull()
})
test('theme mode and generated series palette changes resolve chart colors through the series tokens', async () => {
  const palette = seriesPalette(
      recommendColorPalette(generateColorWall({ brand: '#7c3aed' }), {
        working: { neutral: 'lime' }
      })
    ),
    theme = defineTheme({
      id: 'chart-colors',
      name: 'Chart colors',
      modes: {
        light: { tokens: { series: palette.light } },
        dark: { tokens: { series: palette.dark } }
      }
    })
  const { host, render } = await mount(
      <ThemeScope
        theme={theme}
        mode="light"
      >
        <Sample />
      </ThemeScope>
    ),
    light = getComputedStyle(host.querySelector('svg path')!).stroke
  expect(light).not.toBe('none')
  await render(
    <ThemeScope
      theme={theme}
      mode="dark"
    >
      <Sample />
    </ThemeScope>
  )
  const dark = getComputedStyle(host.querySelector('svg path')!).stroke,
    probe = document.createElement('span')
  expect(dark).not.toBe(light)
  probe.style.color = palette.dark['1'].solid
  host.append(probe)
  expect(dark).toBe(getComputedStyle(probe).color)
  probe.remove()
})
test('chart series resolve to the series tokens in every preset and mode', async () => {
  const eight = Array.from({ length: 8 }, (_, index) => ({
      key: `s${index}`,
      label: `Series ${index + 1}`
    })),
    rows = data.map(row => ({
      ...row,
      values: Object.fromEntries(eight.map((item, index) => [item.key, index + 1]))
    }))
  for (const theme of themes)
    for (const mode of ['light', 'dark'] as const) {
      const { host } = await mount(
        <ThemeScope
          theme={theme}
          mode={mode}
        >
          <Sample
            data={rows}
            series={eight}
          />
          {eight.map((_, index) => (
            <i
              key={index}
              data-token
              style={{ color: `var(--rad-series-${index + 1}-solid)` }}
            />
          ))}
        </ThemeScope>
      )
      const strokes = Array.from(
        host.querySelectorAll('svg path[stroke]'),
        path => getComputedStyle(path).stroke
      )
      const tokens = Array.from(
        host.querySelectorAll('[data-token]'),
        node => getComputedStyle(node).color
      )
      expect(new Set(tokens).size, `${theme.id}/${mode}`).toBe(8)
      expect(strokes, `${theme.id}/${mode}`).toEqual(tokens)
    }
})
test('empty, missing and all-zero data have readable alternatives without phantom values', async () => {
  const empty = await mount(<Sample data={[]} />)
  expect(empty.host.textContent).toContain('No chart data to display.')
  expect(points(empty.host)).toEqual([])
  const missing = await mount(
    <Sample data={[{ key: 'missing', label: 'Unknown', values: { completed: null } }]} />
  )
  expect(missing.host.querySelector('tbody')?.textContent).toContain('—')
  expect(points(missing.host)).toEqual([])
  const zero = await mount(
    <PieChart
      label="No sessions"
      data={[{ key: 'zero', label: 'No sessions', values: { completed: 0 } }]}
      series={[series[0]!]}
    />
  )
  expect(zero.host.textContent).toContain('No chart data')
  expect(zero.host.querySelector('tbody')?.textContent).toContain('0')
})
test('the caption names the plot and table, and each part carries a chart slot', async () => {
  const { host } = await mount(
    <>
      <Sample
        parts={{
          caption: { className: 'caption-part' },
          description: { className: 'description-part' },
          plot: { className: 'plot-part' },
          legend: { className: 'legend-part' },
          tooltip: { className: 'tooltip-part' }
        }}
      />
      <BarChart
        label={<span>Study recruitment</span>}
        data={data}
        series={series}
      />
    </>
  )
  const [first, second] = Array.from(host.querySelectorAll('figure'))
  expect(first!.querySelector('[data-slot~="scroll-area"]')).toHaveAccessibleName(
    'Research sessions'
  )
  expect(second!.querySelector('[data-slot~="scroll-area"]')).toHaveAccessibleName(
    'Study recruitment'
  )
  expect(second!.querySelector('caption')?.textContent).toBe('Study recruitment')
  for (const [slot, part] of [
    ['chart-caption', 'caption-part'],
    ['chart-description', 'description-part'],
    ['chart-plot', 'plot-part'],
    ['chart-legend', 'legend-part']
  ])
    expect(first!.querySelector(`[data-slot="${slot}"]`)?.classList.contains(part)).toBe(true)
  const tooltip = first!.querySelector<HTMLElement>('[role="tooltip"]')
  expect(tooltip?.dataset.slot).toBe('tooltip-content chart-tooltip')
  expect(tooltip?.classList.contains('tooltip-part')).toBe(true)
  expect(first!.querySelector('details')?.dataset.slot).toBe('chart-disclosure')
  const empty = await mount(<Sample data={[]} />)
  expect(empty.host.querySelector('[data-slot="chart-empty"]')?.textContent).toBe(
    'No chart data to display.'
  )
})
test('standalone table props and refs reach the actual Table host', async () => {
  const ref = createRef<HTMLTableElement>(),
    { host } = await mount(
      <ChartDataTable
        ref={ref}
        label="Counts"
        data={data}
        series={series}
        className="outline"
      />
    )
  expect(ref.current).toBe(host.querySelector('table'))
  expect(ref.current?.classList.contains('outline')).toBe(true)
})

test('responsive SVG geometry preserves circular pie slices and unscaled text after container resizing', async () => {
  const { host, render } = await mount(
    <PieChart
      label="Methods"
      data={data}
      series={[series[0]!]}
      style={{ width: 800 }}
    />
  )
  const proportional = () => {
    const svg = host.querySelector('svg')!,
      rect = svg.getBoundingClientRect(),
      box = svg.viewBox.baseVal
    expect(rect.width / box.width).toBeCloseTo(rect.height / box.height, 3)
  }
  await vi.waitFor(proportional)
  await render(
    <PieChart
      label="Methods"
      data={data}
      series={[series[0]!]}
      style={{ width: 560 }}
    />
  )
  await vi.waitFor(proportional)
})

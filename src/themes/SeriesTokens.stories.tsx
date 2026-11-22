import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { BarChart, LineChart } from '../charts/index.js'

const meta = {
  title: 'System/Series colors',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The eight categorical series tokens in the global theme and mode. Each series keeps one colour across every family that reads it: chart marks use `solid`, and tags or highlighted text use `text` on `soft` inside `border`.'
      }
    }
  }
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

const series = Array.from({ length: 8 }, (_, index) => ({
  key: `series${index + 1}`,
  label: `Series ${index + 1}`
}))
const data = ['Round 1', 'Round 2', 'Round 3'].map((label, row) => ({
  key: `round${row + 1}`,
  label,
  values: Object.fromEntries(
    series.map((item, index) => [item.key, 4 + ((index * 3 + row * 5) % 11)])
  )
}))
const token = (index: number, variant: string) => `var(--rad-series-${index + 1}-${variant})`

export const Default: Story = {
  render: () => (
    <div className="grid max-w-3xl gap-6">
      <ul
        aria-label="Series swatches"
        className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3 p-0"
      >
        {series.map((item, index) => (
          <li
            key={item.key}
            className="grid gap-2"
          >
            <span
              aria-hidden="true"
              className="h-8 rounded-md"
              style={{ background: token(index, 'solid') }}
            />
            <span
              className="rounded-md border border-solid px-2 py-1 text-sm"
              style={{
                background: token(index, 'soft'),
                borderColor: token(index, 'border'),
                color: token(index, 'text')
              }}
            >
              {item.label}
            </span>
          </li>
        ))}
      </ul>
      <LineChart
        label="Eight series as lines"
        data={data}
        series={series}
      />
      <BarChart
        label="Eight series as bars"
        data={data}
        series={series}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const swatches = within(canvas.getByRole('list', { name: 'Series swatches' }))
    await expect(swatches.getAllByRole('listitem')).toHaveLength(8)
    await expect(canvas.getByRole('figure', { name: 'Eight series as bars' })).toBeVisible()
  }
}

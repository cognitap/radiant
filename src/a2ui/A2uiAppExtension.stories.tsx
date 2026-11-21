import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { A2uiSurface } from './A2uiSurface.js'
import {
  SPARKLINE_SURFACE_ID,
  sparklineFixtureMessages,
  sparklineRegistry
} from './appExtensionFixtures.js'

const meta = {
  title: 'A2UI/App extension',
  component: A2uiSurface,
  args: {
    surfaceId: SPARKLINE_SURFACE_ID,
    messages: sparklineFixtureMessages,
    registry: sparklineRegistry
  },
  render: args => (
    <div className="grid max-w-md gap-4">
      <A2uiSurface {...args} />
    </div>
  )
} satisfies Meta<typeof A2uiSurface>

export default meta

type Story = StoryObj<typeof meta>

/** An application Sparkline drawn with public tokens; the theme matrix runs it in every preset and mode. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const view = canvasElement.ownerDocument.defaultView!
    const expected = (token: string, host: Element) => {
      const probe = canvasElement.ownerDocument.createElement('span')
      probe.style.color = `var(${token})`
      host.parentElement!.append(probe)
      const color = view.getComputedStyle(probe).color
      probe.remove()
      return color
    }
    for (const [name, token] of [
      ['Signups', '--rad-color-accent'],
      ['Latency', '--rad-color-warning'],
      ['Errors', '--rad-color-danger']
    ] as const) {
      const svg = await canvas.findByRole('img', { name })
      const trend = svg.querySelector('[data-part="trend"]')!
      const stroke = view.getComputedStyle(trend).stroke
      await expect(stroke).not.toMatch(/^(?:none|transparent|rgba\(.*,\s*0\))$|\/\s*0\)$/)
      await expect(stroke).toBe(expected(token, svg))
    }
  }
}

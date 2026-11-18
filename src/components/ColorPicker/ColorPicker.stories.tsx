import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ColorPicker } from './ColorPicker.js'

const swatches = [
  { color: '#405CE0', label: 'Indigo' },
  { color: 'rgb(36 140 97)', label: 'Fern' },
  { color: 'oklch(69% 0.18 41)', label: 'Clay' },
  { color: '#EC9CCA80', label: 'Translucent orchid' }
]

const meta = {
  title: 'Components/ColorPicker',
  component: ColorPicker,
  args: { label: 'Accent color', defaultValue: '#405CE0' },
  parameters: {
    docs: {
      description: {
        component:
          'Edit an OKLCH color from the color area or the Lightness and Chroma sliders. Hue and opacity have their own sliders. Choose the format emitted to the value owner.'
      }
    }
  }
} satisfies Meta<typeof ColorPicker>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const UseBrandSwatches: Story = {
  args: { label: 'Brand accent', swatches, format: 'oklch' }
}

function OverlayColor() {
  const [value, setValue] = useState('rgb(45 62 115 / 0.6)')
  return (
    <div className="grid w-full max-w-xs gap-3">
      <div className="h-16 rounded-[var(--rad-surface-radius)] bg-[var(--rad-color-neutral)]">
        <div
          className="h-full rounded-[inherit]"
          style={{ background: value }}
          aria-hidden="true"
        />
      </div>
      <ColorPicker
        label="Map overlay"
        value={value}
        onValueChange={setValue}
        format="rgb"
        eyedropper
      />
    </div>
  )
}
export const Controlled: Story = { name: 'Tint a map overlay', render: () => <OverlayColor /> }

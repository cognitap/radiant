import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../Button/Button.js'
import { Field } from '../Field/Field.js'
import { ColorInput } from './ColorInput.js'

const swatches = [
  { color: '#405CE0', label: 'Indigo' },
  { color: '#248C61', label: 'Fern' },
  { color: 'rgb(188 78 43 / .65)', label: 'Translucent clay' }
]
const meta = {
  title: 'Components/ColorInput',
  component: ColorInput,
  args: { 'aria-label': 'Accent color', defaultValue: '#405CE0', swatches },
  parameters: {
    docs: {
      description: {
        component:
          'Type hex, RGB or OKLCH, or edit the color in the popup. Native forms receive the normalized value in the configured format.'
      }
    }
  }
} satisfies Meta<typeof ColorInput>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

function ThemeColorForm() {
  const [saved, setSaved] = useState('')
  return (
    <form
      className="grid w-full max-w-xs gap-3"
      onReset={() => setSaved('')}
      onSubmit={event => {
        event.preventDefault()
        setSaved(String(new FormData(event.currentTarget).get('accent')))
      }}
    >
      <Field
        label="Workspace accent"
        description="Enter hex, RGB, or OKLCH."
        required
      >
        <ColorInput
          name="accent"
          placeholder="#405CE0"
          swatches={swatches}
        />
      </Field>
      <div className="flex gap-2">
        <Button type="submit">Save accent</Button>
        <Button
          type="reset"
          variant="outline"
        >
          Reset
        </Button>
      </div>
      <output className="text-sm">{saved && `Saved ${saved}`}</output>
    </form>
  )
}
export const WithField: Story = {
  name: 'Save a workspace accent',
  render: () => <ThemeColorForm />
}

function OverlayTint() {
  const [value, setValue] = useState('rgb(34 94 110 / 0.6)')
  return (
    <div className="grid w-full max-w-xs gap-3">
      <Field label="Overlay tint">
        <ColorInput
          format="rgb"
          value={value}
          onValueChange={setValue}
          swatches={swatches}
        />
      </Field>
      <Button
        variant="outline"
        onClick={() => setValue('rgb(34 94 110 / 0.6)')}
      >
        Restore original tint
      </Button>
    </div>
  )
}
export const Controlled: Story = { name: 'Edit an overlay tint', render: () => <OverlayTint /> }

export const InspectAnInheritedAccent: Story = {
  args: { 'aria-label': 'Inherited accent', readOnly: true, defaultValue: '#405CE0' }
}

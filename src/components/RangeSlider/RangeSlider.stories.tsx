import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Field } from '../Field/Field.js'
import { RangeSlider, type RangeSliderValue } from './RangeSlider.js'

const meta = {
  title: 'Components/RangeSlider',
  component: RangeSlider,
  args: {
    'aria-label': 'Price range',
    lowerLabel: 'Minimum price',
    upperLabel: 'Maximum price',
    defaultValue: [20, 80],
    className: 'max-w-sm'
  }
} satisfies Meta<typeof RangeSlider>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

function FilterByPrice() {
  const [value, setValue] = useState<RangeSliderValue>([30, 150])
  return (
    <Field
      label="Price filter"
      description="Prices in dollars"
      className="max-w-sm"
    >
      <RangeSlider
        name="price"
        lowerLabel="Minimum price"
        upperLabel="Maximum price"
        min={10}
        max={250}
        step={5}
        value={value}
        onValueChange={setValue}
      />
      <output>
        {value[0]} to {value[1]} dollars
      </output>
    </Field>
  )
}

export const SetAPriceFilter: Story = { render: () => <FilterByPrice /> }

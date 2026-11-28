import type { Meta, StoryObj } from '@storybook/react-vite'
import { Radio, RadioGroup } from '../../index.js'

const controls = { include: ['label', 'controlSize', 'disabled'] }
const meta = {
  title: 'Components/RadioGroup',
  component: RadioGroup,
  parameters: { controls, docs: { controls } },
  args: {
    label: 'Delivery speed',
    defaultValue: 'standard',
    controlSize: 'medium',
    disabled: false
  },
  argTypes: {
    label: { control: 'text' },
    controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] }
  }
} satisfies Meta<typeof RadioGroup>

export default meta
type Story = StoryObj<typeof meta>

const options = (
  <>
    <Radio
      value="standard"
      label="Standard"
      description="Arrives in 3 to 5 days."
    />
    <Radio
      value="overnight"
      label="Overnight"
      disabled
    />
    <Radio
      value="express"
      label="Express"
      description="Arrives in 2 days."
    />
  </>
)

export const Default: Story = {
  render: args => <RadioGroup {...args}>{options}</RadioGroup>
}

export const WithField: Story = {
  args: { defaultValue: undefined, 'aria-invalid': false },
  argTypes: { 'aria-invalid': { control: 'boolean', name: 'Show error' } },
  parameters: { controls: { include: [...controls.include, 'aria-invalid'] } },
  render: ({ 'aria-invalid': invalid, ...args }) => (
    <RadioGroup
      {...args}
      required
      description="Choose one speed."
      error={invalid ? 'Select a delivery speed.' : undefined}
    >
      {options}
    </RadioGroup>
  )
}

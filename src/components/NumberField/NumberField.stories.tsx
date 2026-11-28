import type { Meta, StoryObj } from '@storybook/react-vite'
import { Field, NumberField, type NumberFieldProps } from '../../index.js'

type Args = Pick<
  NumberFieldProps,
  | 'aria-label'
  | 'controlSize'
  | 'defaultValue'
  | 'dir'
  | 'disabled'
  | 'formatOptions'
  | 'locale'
  | 'max'
  | 'min'
  | 'readOnly'
  | 'step'
  | 'steppers'
> & { invalid?: boolean }

const controls = { include: ['controlSize', 'dir', 'disabled', 'readOnly', 'steppers'] }
const meta = {
  title: 'Components/NumberField',
  component: NumberField,
  parameters: { controls, docs: { controls } },
  args: {
    'aria-label': 'Quantity',
    defaultValue: 3,
    min: 0,
    max: 12,
    controlSize: 'medium',
    dir: 'ltr',
    disabled: false,
    readOnly: false,
    steppers: true
  },
  argTypes: {
    controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] }
  },
  decorators: [
    Story => (
      <div style={{ width: 'min(26rem, calc(100vw - 2rem))', maxWidth: '100%' }}>
        <Story />
      </div>
    )
  ]
} satisfies Meta<Args>

export default meta
type Story = StoryObj<Args>

export const Default: Story = {
  render: ({ invalid: _invalid, ...args }) => <NumberField {...args} />
}

export const WithField: Story = {
  args: { invalid: false, min: 1, defaultValue: null },
  argTypes: { invalid: { control: 'boolean' } },
  parameters: { controls: { include: [...controls.include, 'invalid'] } },
  render: ({ invalid, disabled, ...args }) => (
    <Field
      label="Quantity"
      description="From 1 to 12."
      error={invalid ? 'Enter a quantity from 1 to 12.' : undefined}
      disabled={disabled}
      required
    >
      <NumberField
        {...args}
        aria-label={undefined}
        name="quantity"
      />
    </Field>
  )
}

export const LocalizedCurrency: Story = {
  args: {
    defaultValue: 12.5,
    min: 0,
    max: 100,
    step: 0.25,
    locale: 'de-DE',
    formatOptions: { style: 'currency', currency: 'EUR' }
  },
  render: ({ invalid: _invalid, ...args }) => (
    <Field label="Price">
      <NumberField
        {...args}
        aria-label={undefined}
        name="price"
      />
    </Field>
  )
}

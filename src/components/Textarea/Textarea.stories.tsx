import type { Meta, StoryObj } from '@storybook/react-vite'
import { Field, Textarea } from '../../index.js'
import {
  TextareaAutoGrowExample,
  TextareaControlledExample
} from '../../../.storybook/examples/TextareaExamples.js'

const meta = {
  title: 'Components/Textarea',
  component: Textarea,
  args: {
    name: 'notes',
    placeholder: 'Write a few lines…',
    rows: 3,
    controlSize: 'medium',
    disabled: false,
    'aria-label': 'Notes'
  },
  argTypes: {
    rows: { control: 'number' },
    controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] }
  }
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithField: Story = {
  render: args => (
    <Field
      label="Project description"
      description="Up to 200 characters."
      required
    >
      <Textarea
        {...args}
        aria-label={undefined}
        maxLength={200}
      />
    </Field>
  )
}
export const Controlled: Story = {
  parameters: { controls: { disable: true } },
  render: () => <TextareaControlledExample />
}
export const AutoGrow: Story = {
  parameters: { controls: { disable: true } },
  render: () => <TextareaAutoGrowExample />
}
export const States: Story = {
  render: args => {
    const { value: _value, defaultValue: _defaultValue, ...nativeProps } = args
    return (
      <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '32rem', minWidth: 0 }}>
        <Field
          label="Description with error"
          error="Add a description."
          required
        >
          <Textarea
            {...nativeProps}
            aria-label={undefined}
          />
        </Field>
        <Field
          label="Disabled description"
          disabled
        >
          <Textarea
            {...nativeProps}
            aria-label={undefined}
            defaultValue="This workspace is archived."
          />
        </Field>
        <Field label="Read-only description">
          <Textarea
            {...nativeProps}
            aria-label={undefined}
            readOnly
            defaultValue={'A published introduction.\nStill available to select and copy.'}
          />
        </Field>
      </div>
    )
  }
}

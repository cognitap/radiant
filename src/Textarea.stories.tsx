import type { Meta, StoryObj } from '@storybook/react-vite'
import { Field, Textarea } from './index.js'
import {
  TextareaAutoGrowExample,
  TextareaDraftExample,
  TextareaSizeComparison
} from '../.storybook/examples/TextareaExamples.js'

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
  },
  parameters: {
    docs: {
      description: {
        component:
          'A native textarea with value/onChange or defaultValue and one owner per mount. Field supplies label, help, error, disabled and required relationships. rows and cols retain native meanings; controlSize sets shared typography and padding. Vertical resizing is enabled by default; add field-sizing-content to grow with content. className, style and ref target the textarea; use resize-none, resize or native styles to change resizing. Textarea overrides fall back to shared tokens independently of Input.'
      }
    }
  }
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithField: Story = {
  render: args => (
    <Field
      label="Project description"
      description="A few lines about what you are making."
      required
    >
      <Textarea
        {...args}
        aria-label={undefined}
      />
    </Field>
  )
}
export const Controlled: Story = {
  parameters: { controls: { disable: true } },
  render: () => <TextareaDraftExample />
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
export const SharedControlSizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => <TextareaSizeComparison />
}
export const Customisation: Story = {
  render: args => (
    <Textarea
      {...args}
      rows={5}
      className="resize-none"
      style={{ '--rad-textarea-radius': '1.25rem', '--rad-textarea-padding-block': '1rem' }}
    />
  )
}

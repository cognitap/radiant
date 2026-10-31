import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { Field, NumberField, type NumberFieldProps } from './index.js'
import {
  PlanParticipantSessions,
  CalculateSessionBudget,
  ChooseAccuracyTarget,
  type NumberFieldTaskOptions
} from '../.storybook/examples/NumberFieldExamples.js'
type Args = NumberFieldTaskOptions &
  Pick<
    NumberFieldProps,
    'locale' | 'formatOptions' | 'min' | 'max' | 'step' | 'largeStep' | 'required'
  > & { initialValue: number | null; invalid: boolean }
const meta = {
  title: 'Components/NumberField',
  component: NumberField,
  parameters: { layout: 'padded' },
  args: {
    controlSize: 'medium',
    dir: 'ltr',
    disabled: false,
    readOnly: false,
    required: false,
    invalid: false,
    initialValue: 3,
    min: 0,
    max: 100,
    step: 1,
    largeStep: 10,
    locale: 'en-US',
    incrementLabel: 'Increase value',
    decrementLabel: 'Decrease value'
  },
  argTypes: {
    controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    required: { control: 'boolean' },
    invalid: { control: 'boolean' },
    initialValue: { control: 'number' },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    largeStep: { control: 'number' },
    locale: { control: 'text' },
    formatOptions: { control: 'object' },
    incrementLabel: { control: 'text' },
    decrementLabel: { control: 'text' },
    className: { control: 'text' },
    style: { control: 'object' },
    parts: { control: 'object' }
  },
  render: ({ initialValue, invalid, ...args }) => (
    <div style={{ width: 'min(28rem,100%)' }}>
      <Field
        label="Participants"
        required={args.required}
        disabled={args.disabled}
        error={invalid ? 'Review the participant count.' : undefined}
      >
        <NumberField
          key={String(initialValue)}
          {...args}
          defaultValue={initialValue}
          name="participants"
        />
      </Field>
    </div>
  )
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>
function task({
  controlSize,
  dir,
  disabled,
  readOnly,
  className,
  style,
  parts
}: Args): NumberFieldTaskOptions {
  return { controlSize, dir, disabled, readOnly, className, style, parts }
}
export const Default: Story = {}
export const PlanningParticipantSessions: Story = {
  render: args => <PlanParticipantSessions {...task(args)} />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(c.getByRole('spinbutton', { name: /Participants/ }))
    await userEvent.keyboard('{ArrowUp}{PageUp}')
    await userEvent.click(c.getByRole('button', { name: 'Plan session' }))
    await expect(c.getByRole('status')).toHaveTextContent(
      'Session planned for 9 participants; 135 participant-minutes.'
    )
  }
}
export const CalculatingSessionBudget: Story = {
  render: args => <CalculateSessionBudget {...task(args)} />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(c.getByRole('button', { name: 'Increase session rate' }))
    await userEvent.click(c.getByRole('button', { name: 'Calculate four sessions' }))
    await expect(c.getByRole('status')).toHaveTextContent('51,00')
    await expect(c.getByRole('status')).toHaveTextContent('Raw session rate: 12.75.')
  }
}
export const Controlled: Story = {
  render: args => <ChooseAccuracyTarget {...task(args)} />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      input = c.getByRole('spinbutton', { name: /Required accuracy/ })
    await userEvent.click(input)
    await userEvent.keyboard('{PageUp}{PageUp}{ArrowUp}')
    await expect(input).toHaveValue('95%')
    await expect(c.getByRole('status')).toHaveTextContent('Targets above 95% need review.')
    await userEvent.click(c.getByRole('button', { name: 'Save target' }))
    await expect(c.getByRole('status')).toHaveTextContent('Raw value: 0.95.')
  }
}
export const WithField: Story = {
  render: args => (
    <div style={{ width: 'min(28rem,100%)' }}>
      <Field
        controlId="study-count"
        label="Session count"
        description="Use a whole number between one and twelve."
        required
        disabled={args.disabled}
        error={args.invalid ? 'Choose a session count.' : undefined}
      >
        <NumberField
          {...task(args)}
          name="sessions"
          min={1}
          max={12}
          defaultValue={3}
        />
      </Field>
    </div>
  )
}
export const SharedControlSizes: Story = {
  render: args => (
    <div style={{ display: 'grid', gap: '1rem', width: 'min(28rem,100%)' }}>
      {(['small', 'medium', 'large'] as const).map(size => (
        <Field
          key={size}
          label={size + ' participant count'}
        >
          <NumberField
            {...task(args)}
            defaultValue={3}
            controlSize={size}
          />
        </Field>
      ))}
    </div>
  )
}

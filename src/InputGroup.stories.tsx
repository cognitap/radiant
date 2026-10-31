import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { Field, InputGroup, InputGroupAddon, InputGroupInput } from './index.js'
import { MotionProvider } from './motion/react.js'
import {
  ControlProjectSlug,
  FindProjectWithAddons,
  InputGroupSizeComparison,
  SetProjectBudget,
  PostStudyUpdate,
  type InputGroupTaskOptions
} from '../.storybook/examples/InputGroupExamples.js'
const meta = {
  title: 'Components/InputGroup',
  component: FindProjectWithAddons,
  args: {
    controlSize: 'medium',
    dir: 'ltr',
    disabled: false,
    readOnly: false,
    invalid: false,
    modifier: 'Control'
  },
  argTypes: {
    controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] },
    modifier: { control: 'inline-radio', options: ['Control', 'Command'] },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    invalid: { control: 'boolean' },
    className: { control: 'text' },
    style: { control: 'object' }
  },
  render: args => (
    <MotionProvider>
      <FindProjectWithAddons {...args} />
    </MotionProvider>
  )
} satisfies Meta<InputGroupTaskOptions>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: ({ disabled, readOnly, invalid, modifier: _modifier, ...group }) => (
    <InputGroup {...group}>
      <InputGroupAddon aria-hidden>radiant.dev/</InputGroupAddon>
      <InputGroupInput
        aria-label="Project URL"
        name="slug"
        defaultValue="reader"
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={invalid || undefined}
      />
    </InputGroup>
  )
}
export const WithField: Story = {
  render: ({ disabled, readOnly, invalid, modifier: _modifier, ...group }) => (
    <Field
      label="Project URL"
      description="Lowercase letters, numbers and hyphens."
      required
      disabled={disabled}
      error={invalid ? 'Use an available project URL.' : undefined}
    >
      <InputGroup {...group}>
        <InputGroupAddon aria-hidden>radiant.dev/</InputGroupAddon>
        <InputGroupInput
          name="slug"
          defaultValue="reader"
          readOnly={readOnly}
        />
      </InputGroup>
    </Field>
  )
}
export const Controlled: Story = {
  parameters: { controls: { disable: true } },
  render: () => <ControlProjectSlug />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      input = canvas.getByRole('textbox', { name: 'Project URL' })
    await userEvent.clear(input)
    await userEvent.type(input, 'Field Notes')
    await expect(input).toHaveValue('field-notes')
    await userEvent.click(canvas.getByRole('button', { name: 'Use suggested URL' }))
    await expect(input).toHaveValue('reader')
  }
}
export const SharedControlSizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => <InputGroupSizeComparison />
}
export const FindingProject: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Find project' }))
    await expect(canvas.getByRole('searchbox', { name: 'Project search' })).toHaveFocus()
    await userEvent.type(canvas.getByRole('searchbox', { name: 'Project search' }), 'Reader')
    await expect(canvas.getByText('Reader study')).toBeVisible()
  }
}
export const SettingBudget: Story = {
  render: args => (
    <MotionProvider>
      <SetProjectBudget {...args} />
    </MotionProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      input = canvas.getByRole('textbox', { name: 'Project budget' })
    await userEvent.clear(input)
    await userEvent.type(input, '350')
    await userEvent.click(canvas.getByRole('button', { name: 'Save budget' }))
    await expect(canvas.getByRole('status')).toHaveTextContent('Budget saved: 350 USD.')
    await userEvent.click(canvas.getByRole('button', { name: 'Restore budget' }))
    await expect(input).toHaveValue('250')
  }
}
export const PostingStudyUpdate: Story = {
  render: args => (
    <MotionProvider>
      <PostStudyUpdate {...args} />
    </MotionProvider>
  )
}

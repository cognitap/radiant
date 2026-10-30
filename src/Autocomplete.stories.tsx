import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within, waitFor } from 'storybook/test'
import { Autocomplete, Field } from './index.js'
import { MotionProvider } from './motion/react.js'
import {
  PlanResearchTopic,
  PrepareParticipantInvitation,
  FindStudyDataset,
  CompletionInput,
  topicSuggestions,
  type AutocompleteTaskOptions
} from '../.storybook/examples/AutocompleteExamples.js'
const meta = {
  title: 'Components/Autocomplete',
  component: PlanResearchTopic,
  parameters: { layout: 'padded' },
  args: {
    controlSize: 'medium',
    dir: 'ltr',
    disabled: false,
    readOnly: false,
    required: true,
    invalid: false,
    motion: 'inherit'
  },
  argTypes: {
    controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    required: { control: 'boolean' },
    invalid: { control: 'boolean' },
    motion: { control: 'inline-radio', options: ['inherit', 'off'] },
    className: { control: 'text' },
    style: { control: 'object' },
    placeholder: { control: 'text' }
  },
  render: options => (
    <MotionProvider>
      <PlanResearchTopic {...options} />
    </MotionProvider>
  )
} satisfies Meta<AutocompleteTaskOptions>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: options => (
    <MotionProvider>
      <div
        dir={options.dir}
        style={{ width: '100%', maxWidth: '26rem', minWidth: 0 }}
      >
        <Field
          label="Topic"
          description="Choose a suggestion or enter any topic."
          disabled={options.disabled}
          required={options.required}
          error={options.invalid ? 'Review the topic.' : undefined}
        >
          <Autocomplete
            items={topicSuggestions}
            controlSize={options.controlSize}
            readOnly={options.readOnly}
          >
            <CompletionInput options={options} />
          </Autocomplete>
        </Field>
      </div>
    </MotionProvider>
  )
}
export const PlanningAResearchTopic: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      input = c.getByRole('combobox', { name: /^Study topic/ })
    await userEvent.clear(input)
    await userEvent.type(input, 'Custom research topic')
    await userEvent.keyboard('{Escape}')
    await userEvent.click(c.getByRole('button', { name: 'Prepare study' }))
    await expect(c.getByText('Study topic prepared: Custom research topic.')).toBeVisible()
  }
}
export const PreparingAnInvitation: Story = {
  render: options => (
    <MotionProvider>
      <PrepareParticipantInvitation {...options} />
    </MotionProvider>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      input = c.getByRole('combobox', { name: /^Recipient email/ })
    await userEvent.clear(input)
    await userEvent.type(input, 'new-participant@example.com')
    await userEvent.keyboard('{Escape}')
    await userEvent.click(c.getByRole('button', { name: 'Prepare invitation' }))
    await expect(c.getByText('Invitation prepared for new-participant@example.com.')).toBeVisible()
  }
}
export const FindingAStudyDataset: Story = {
  render: options => (
    <MotionProvider>
      <FindStudyDataset {...options} />
    </MotionProvider>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      input = c.getByRole('combobox', { name: /^Dataset name/ })
    await userEvent.type(input, 'Reader')
    await waitFor(() => expect(c.getByRole('option', { name: 'Reader study' })).toBeVisible())
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await userEvent.click(c.getByRole('button', { name: 'Prepare dataset request' }))
    await expect(c.getByText('Dataset request prepared: Reader study.')).toBeVisible()
  }
}

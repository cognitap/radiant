import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { Field, NativeSelect } from './index.js'
import { MotionProvider } from './motion/react.js'
import {
  SaveStudyPhase,
  BrowseGroupedStudies,
  FilterParticipantCohorts,
  type NativeSelectTaskOptions
} from '../.storybook/examples/NativeSelectExamples.js'
const meta = {
  title: 'Components/NativeSelect',
  component: SaveStudyPhase,
  args: { controlSize: 'medium', dir: 'ltr', disabled: false, invalid: false, required: true },
  argTypes: {
    controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] },
    disabled: { control: 'boolean' },
    invalid: { control: 'boolean' },
    required: { control: 'boolean' },
    className: { control: 'text' },
    style: { control: 'object' }
  },
  render: args => (
    <MotionProvider>
      <SaveStudyPhase {...args} />
    </MotionProvider>
  )
} satisfies Meta<NativeSelectTaskOptions>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: ({ disabled, invalid, required, ...control }) => (
    <Field
      label="Study phase"
      required={required}
      disabled={disabled}
      error={invalid ? 'Review the study phase.' : undefined}
    >
      <NativeSelect
        {...control}
        defaultValue=""
      >
        <option
          value=""
          disabled
        >
          Choose a phase
        </option>
        <option value="draft">Draft</option>
        <option value="recruiting">Recruiting</option>
        <option value="analysis">Analysis</option>
      </NativeSelect>
    </Field>
  )
}
export const SavingStudyPhase: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.selectOptions(
      canvas.getByRole('combobox', { name: 'Study phase' }),
      'recruiting'
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Save phase' }))
    await expect(canvas.getByRole('status')).toHaveTextContent('Study phase saved: recruiting.')
    await userEvent.click(canvas.getByRole('button', { name: 'Restore phase' }))
    await expect(canvas.getByRole('combobox', { name: 'Study phase' })).toHaveValue('')
  }
}
export const BrowsingGroupedStudies: Story = {
  render: args => <BrowseGroupedStudies {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.selectOptions(canvas.getByRole('combobox', { name: 'Open study' }), 'component')
    await expect(canvas.getByRole('heading', { name: 'Component kit' })).toBeVisible()
    await expect(canvas.getByText('8 participants')).toBeVisible()
  }
}
export const FilteringParticipantCohorts: Story = {
  render: args => (
    <MotionProvider>
      <FilterParticipantCohorts {...args} />
    </MotionProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.selectOptions(canvas.getByRole('listbox', { name: 'Participant cohorts' }), [
      'component'
    ])
    await userEvent.click(canvas.getByRole('button', { name: 'Apply cohorts' }))
    await expect(canvas.getByText('Lea')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Restore cohorts' }))
    await expect(canvas.getByText('Maya')).toBeVisible()
  }
}

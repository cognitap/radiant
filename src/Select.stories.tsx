import type { Meta, StoryObj } from '@storybook/react-vite'
import { Field, Select, SelectTrigger, SelectValue, SelectPortal, SelectContent } from './index.js'
import {
  SelectSettingsExample,
  SelectControlledExample,
  SelectCitiesExample,
  SelectDialogExample,
  workspaceOptions
} from '../.storybook/examples/SelectExamples.js'

const meta = {
  title: 'Components/Select',
  component: Select,
  args: { items: workspaceOptions },
  parameters: { layout: 'centered' }
} satisfies Meta<typeof Select>
export default meta
type Story = StoryObj<typeof meta>

export const Settings: Story = {
  render: () => <SelectSettingsExample />
}
export const Controlled: Story = { render: () => <SelectControlledExample /> }
export const Open: Story = {
  render: () => (
    <Field
      label="Workspace"
      className="w-72"
    >
      <Select
        items={workspaceOptions}
        defaultValue="studio"
        defaultOpen
      />
    </Field>
  )
}
export const ScrollAndGroups: Story = { render: () => <SelectCitiesExample /> }
export const InDialog: Story = { render: () => <SelectDialogExample /> }
export const Required: Story = {
  render: () => (
    <form className="grid w-72 max-w-full gap-3">
      <Field
        label="Workspace"
        required
        description="Choose a destination before submitting."
      >
        <Select
          items={workspaceOptions}
          name="workspace"
        />
      </Field>
      <button type="submit">Submit</button>
    </form>
  )
}
export const Disabled: Story = {
  render: () => (
    <Field
      label="Workspace"
      disabled
      description="An administrator manages this setting."
    >
      <Select
        items={workspaceOptions}
        defaultValue="studio"
      />
    </Field>
  )
}
export const Invalid: Story = {
  render: () => (
    <Field
      label="Workspace"
      error="Choose an active workspace."
    >
      <Select items={workspaceOptions} />
    </Field>
  )
}
export const Customized: Story = {
  render: () => (
    <Field
      label="Workspace"
      className="w-80 max-w-full"
    >
      <Select items={workspaceOptions}>
        <SelectTrigger className="rounded-none border-2">
          <SelectValue placeholder="Choose your space" />
        </SelectTrigger>
        <SelectPortal>
          <SelectContent
            className="rounded-none border-2"
            motion="off"
          />
        </SelectPortal>
      </Select>
    </Field>
  )
}

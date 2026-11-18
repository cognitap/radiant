import type { Meta, StoryObj } from '@storybook/react-vite'
import { InlineEdit } from './InlineEdit.js'

const meta = {
  title: 'Components/InlineEdit',
  component: InlineEdit,
  args: { defaultValue: 'Spring launch', inputLabel: 'Project name', editLabel: 'Rename project' }
} satisfies Meta<typeof InlineEdit>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const RequireAProjectName: Story = {
  args: { validate: draft => (draft.trim() ? undefined : 'Enter a project name.') }
}

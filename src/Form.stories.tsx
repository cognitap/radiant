import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { Form, FormField, FormError, Input, Button } from './index.js'
import {
  CreateResearchWorkspace,
  RecoverWorkspaceInvitation,
  EditProfileWithTanStack
} from '../.storybook/examples/FormExamples.js'
const meta = { title: 'Components/Form', component: CreateResearchWorkspace } satisfies Meta<
  typeof CreateResearchWorkspace
>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: () => (
    <Form
      aria-label="Newsletter"
      onSubmitValues={() => {}}
    >
      <FormField
        name="email"
        label="Email"
        required
      >
        <Input
          name="email"
          type="email"
          autoComplete="email"
        />
      </FormField>
      <FormError />
      <Button type="submit">Subscribe</Button>
    </Form>
  )
}
export const CreatingResearchWorkspace: Story = {
  render: () => <CreateResearchWorkspace />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByRole('textbox', { name: /Owner email/ }), 'owner@example.com')
    await userEvent.type(
      canvas.getByRole('textbox', { name: /Workspace address/ }),
      'atlas-research'
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Create workspace' }))
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Created atlas-research for owner@example.com.'
    )
  }
}
export const RecoveringServerErrors: Story = { render: () => <RecoverWorkspaceInvitation /> }
export const Controlled: Story = { render: () => <EditProfileWithTanStack /> }

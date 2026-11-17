import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { Form, FormField, FormError, Input, Button } from '../../index.js'
import {
  CreateResearchWorkspace,
  RecoverWorkspaceInvitation,
  EditProfileWithTanStack,
  ReviewerErrors,
  ResumeDraft,
  RetryFailedRequest
} from '../../../.storybook/examples/FormExamples.js'
const meta = {
  title: 'Components/Form',
  component: Form,
  args: { 'aria-label': 'Form' }
} satisfies Meta<typeof Form>
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
export const Controlled: Story = {
  render: () => <ReviewerErrors />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Load reviewer notes' }))
    await expect(canvas.getByText('A reviewer left notes on this study.')).toBeVisible()
    await userEvent.type(canvas.getByRole('textbox', { name: /Study title/ }), '!')
    await expect(canvas.getByText('Field errors: 0')).toBeVisible()
  }
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
export const RetryingAFailedRequest: Story = {
  render: () => <RetryFailedRequest />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const submit = canvas.getByRole('button', { name: 'Export results' })
    const failure = 'The export service is unavailable. Try again in a minute.'
    await userEvent.click(submit)
    await expect(await canvas.findByText(failure)).toBeVisible()
    await userEvent.click(submit)
    await expect(await canvas.findByText('Exported results as csv.')).toBeVisible()
    await expect(canvas.queryByText(failure)).toBeNull()
  }
}
export const ResumingADraftWithErrors: Story = { render: () => <ResumeDraft /> }
export const WithTanStackForm: Story = { render: () => <EditProfileWithTanStack /> }

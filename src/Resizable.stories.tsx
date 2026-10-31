import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import {
  ReviewProjectFiles,
  EditInterviewNotes,
  RestoreWorkspaceLayout,
  type ResizableTaskOptions
} from '../.storybook/examples/ResizableExamples.js'
const meta = {
  title: 'Components/Resizable',
  component: ReviewProjectFiles,
  parameters: { layout: 'padded' },
  args: { orientation: 'horizontal', disabled: false, dir: 'ltr', step: 1, largeStep: 10 },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    disabled: { control: 'boolean' },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] },
    step: { control: 'number' },
    largeStep: { control: 'number' },
    className: { control: 'text' },
    style: { control: 'object' },
    handleClassName: { control: 'text' },
    handleStyle: { control: 'object' }
  },
  render: args => <ReviewProjectFiles {...args} />
} satisfies Meta<ResizableTaskOptions>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const ReviewingProjectFiles: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      handle = c.getByRole('separator', { name: 'Project files' })
    await userEvent.click(handle)
    await userEvent.keyboard('{ArrowRight}')
    await expect(handle).toHaveAttribute('aria-valuenow', '33')
    await userEvent.click(c.getByRole('button', { name: 'Collapse files' }))
    await expect(handle).toHaveAttribute('aria-valuenow', '0')
    await userEvent.click(c.getByRole('button', { name: 'Restore files' }))
    await expect(handle).toHaveAttribute('aria-valuenow', '33')
    await userEvent.click(c.getByRole('button', { name: 'session.json' }))
    await expect(c.getByRole('heading', { name: 'session.json' })).toBeVisible()
  }
}
export const EditingInterviewNotes: Story = {
  args: { orientation: 'vertical' },
  render: args => <EditInterviewNotes {...args} />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      handle = c.getByRole('separator', { name: 'Interview note editor' })
    await userEvent.click(handle)
    await userEvent.keyboard('{ArrowDown}')
    await expect(handle).toHaveAttribute('aria-valuenow', '56')
    await userEvent.clear(c.getByRole('textbox', { name: 'Interview notes' }))
    await userEvent.type(
      c.getByRole('textbox', { name: 'Interview notes' }),
      'The participant requested larger text.'
    )
    await userEvent.click(c.getByRole('button', { name: 'Prepare note snapshot' }))
    await expect(c.getByRole('group', { name: 'Note snapshot JSON' })).toHaveTextContent(
      '"wordCount": 5'
    )
  }
}
export const Controlled: Story = {
  render: args => <RestoreWorkspaceLayout {...args} />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      handle = c.getByRole('separator', { name: 'Workspace navigation' })
    await userEvent.click(handle)
    await userEvent.keyboard('{Enter}')
    await expect(handle).toHaveAttribute('aria-valuenow', '20')
    await expect(c.getByRole('status', { name: 'Workspace layout feedback' })).toHaveTextContent(
      'Keep navigation visible is enabled.'
    )
    await userEvent.click(c.getByRole('button', { name: 'Widen navigation' }))
    await expect(handle).toHaveAttribute('aria-valuenow', '25')
    await userEvent.click(c.getByRole('button', { name: 'Save layout' }))
    await userEvent.click(c.getByRole('button', { name: 'Reset layout' }))
    await expect(handle).toHaveAttribute('aria-valuenow', '20')
    await userEvent.click(c.getByRole('button', { name: 'Restore saved layout' }))
    await expect(handle).toHaveAttribute('aria-valuenow', '25')
    await expect(c.getByRole('status', { name: 'Workspace layout feedback' })).toHaveTextContent(
      'Saved workspace layout restored.'
    )
  }
}

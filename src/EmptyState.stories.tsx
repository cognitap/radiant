import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within, waitFor } from 'storybook/test'
import { MotionProvider } from './motion/react.js'
import {
  EmptyMessage,
  CreateStudyProject,
  FindStudyProject,
  RecoverStudyReports,
  type EmptyStateTaskOptions
} from '../.storybook/examples/EmptyStateExamples.js'
import type { EmptyStateVariant } from './index.js'
type Options = EmptyStateTaskOptions & { variant?: EmptyStateVariant }
const meta = {
  title: 'Components/EmptyState',
  component: EmptyMessage,
  parameters: { layout: 'padded' },
  args: { variant: 'first-use', tone: 'neutral', level: 3, dir: 'ltr' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['first-use', 'no-results', 'error'] },
    tone: { control: 'inline-radio', options: ['neutral', 'accent', 'warning', 'danger'] },
    level: { control: 'select', options: [1, 2, 3, 4, 5, 6] },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] },
    className: { control: 'text' },
    style: { control: 'object' }
  },
  render: options => <EmptyMessage {...options} />
} satisfies Meta<Options>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const CreatingAStudyProject: Story = {
  render: options => (
    <MotionProvider>
      <CreateStudyProject {...options} />
    </MotionProvider>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(c.getByRole('button', { name: 'Create study project' }))
    await expect(c.getByRole('cell', { name: 'Reader study' })).toBeVisible()
    await expect(c.getByRole('button', { name: 'Open Reader study' })).toHaveFocus()
  }
}
export const FindingAStudyProject: Story = {
  render: options => (
    <MotionProvider>
      <FindStudyProject {...options} />
    </MotionProvider>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      input = c.getByRole('combobox', { name: /^Project/ })
    await userEvent.type(input, 'Missing')
    await expect(c.getByRole('heading', { name: 'No matching projects' })).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await userEvent.click(c.getByRole('button', { name: 'Clear search' }))
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await userEvent.click(c.getByRole('button', { name: 'Open project' }))
    await expect(c.getByRole('heading', { name: 'Reader study' })).toBeVisible()
  }
}
export const RecoveringStudyReports: Story = {
  render: options => (
    <MotionProvider>
      <RecoverStudyReports {...options} />
    </MotionProvider>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(c.getByRole('button', { name: 'Find a study report' }))
    await expect(c.getByRole('heading', { name: 'Reports unavailable' })).toBeVisible()
    await userEvent.keyboard('{Tab}')
    await expect(c.getByRole('button', { name: 'Retry report search' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await waitFor(() =>
      expect(c.getByRole('option', { name: 'Reader study report' })).toBeVisible()
    )
    await expect(c.getByRole('combobox', { name: 'Search commands' })).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await expect(c.getByRole('heading', { name: 'Reader study report' })).toHaveFocus()
  }
}

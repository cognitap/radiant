import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { Progress } from './index.js'
import { UploadFiles } from '../.storybook/examples/ProgressExamples.js'
const meta = {
  title: 'Components/Progress',
  component: Progress,
  parameters: {
    docs: {
      description: {
        component:
          'Native progress for task completion, named with a native label, aria-label or aria-labelledby. Minimum is zero and max defaults to 100. Omit value or pass null while the remaining work is unknown. aria-valuetext replaces the announced percentage with a phrase. Use Meter for a measured level such as storage used.'
      }
    }
  },
  args: { value: 40, max: 100, 'aria-label': 'Export progress' },
  argTypes: {
    value: { control: 'number' },
    max: { control: 'number' },
    'aria-label': { control: 'text' },
    'aria-valuetext': { control: 'text' },
    className: { control: 'text' },
    style: { control: 'object' }
  },
  render: args => (
    <div style={{ width: 'min(20rem, calc(100vw - 2rem))', maxWidth: '100%' }}>
      <Progress {...args} />
      <p>
        {args.value == null ? 'Remaining work unknown' : `${args.value} of ${args.max ?? 100}`}.
      </p>
    </div>
  )
} satisfies Meta<typeof Progress>
export default meta
type Story = StoryObj<typeof meta>
const taskControls = {
  value: { control: false, table: { disable: true } },
  max: { control: false, table: { disable: true } },
  'aria-label': { control: false, table: { disable: true } },
  'aria-valuetext': { control: false, table: { disable: true } }
} as const
export const Default: Story = {}
export const Indeterminate: Story = {
  args: { value: null, 'aria-label': 'Preparing export' }
}
export const WithValueText: Story = {
  argTypes: taskControls,
  render: ({ className, style }) => (
    <div style={{ width: 'min(20rem, calc(100vw - 2rem))', maxWidth: '100%' }}>
      <label htmlFor="import-progress">Import progress</label>
      <Progress
        id="import-progress"
        value={2}
        max={4}
        aria-valuetext="Step 2 of 4: matching participants"
        className={className}
        style={style}
      />
      <p>Step 2 of 4: matching participants.</p>
    </div>
  )
}
export const UploadingFiles: Story = {
  argTypes: taskControls,
  render: ({ className, style }) => (
    <UploadFiles
      className={className}
      style={style}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Upload files' }))
    const progress = canvas.getByRole('progressbar', { name: 'Upload progress' })
    await expect(progress).not.toHaveAttribute('value')
    await userEvent.click(canvas.getByRole('button', { name: 'Finish preparing' }))
    for (let index = 0; index < 5; index++)
      await userEvent.click(canvas.getByRole('button', { name: 'Upload next file' }))
    await expect(progress).toHaveAttribute('aria-valuetext', '5 of 5 files uploaded')
    await expect(canvas.getByRole('status')).toHaveTextContent('All study files uploaded.')
  }
}
export const Customisation: Story = {
  args: {
    value: 3,
    max: 5,
    'aria-label': 'Upload progress',
    style: {
      '--rad-progress-height': '1rem',
      '--rad-progress-radius': '.25rem',
      '--rad-progress-indicator-color': 'var(--rad-color-warning)'
    }
  }
}

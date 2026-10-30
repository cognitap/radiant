import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { Meter } from './index.js'
import { MotionProvider } from './motion/react.js'
import {
  ManageRecordingStorage,
  ChooseRecorder,
  ChooseStudyRoom
} from '../.storybook/examples/MeterExamples.js'
const meta = {
  title: 'Components/Meter',
  component: Meter,
  args: {
    value: 0.65,
    min: 0,
    max: 1,
    low: 0.25,
    high: 0.75,
    optimum: 0.5,
    'aria-label': 'Measured level',
    dir: 'ltr'
  },
  argTypes: {
    value: { control: 'number' },
    min: { control: 'number' },
    max: { control: 'number' },
    low: { control: 'number' },
    high: { control: 'number' },
    optimum: { control: 'number' },
    'aria-label': { control: 'text' },
    'aria-valuetext': { control: 'text' },
    className: { control: 'text' },
    style: { control: 'object' },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] }
  },
  render: args => (
    <div style={{ width: 'min(20rem, calc(100vw - 2rem))', maxWidth: '100%' }}>
      <Meter {...args} />
      <p>
        {args.value} within {args.min}–{args.max}.
      </p>
    </div>
  )
} satisfies Meta<typeof Meter>
export default meta
type Story = StoryObj<typeof meta>
const taskControls = {
  value: { control: false, table: { disable: true } },
  min: { control: false, table: { disable: true } },
  max: { control: false, table: { disable: true } },
  low: { control: false, table: { disable: true } },
  high: { control: false, table: { disable: true } },
  optimum: { control: false, table: { disable: true } },
  'aria-label': { control: false, table: { disable: true } },
  'aria-valuetext': { control: false, table: { disable: true } }
} as const
export const Default: Story = {}
export const ManagingRecordingStorage: Story = {
  argTypes: taskControls,
  render: ({ className, style, dir }) => (
    <MotionProvider>
      <ManageRecordingStorage
        className={className}
        style={style}
        dir={dir}
      />
    </MotionProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Archive interviews' }))
    await expect(canvas.getByRole('meter', { name: 'Recording storage used' })).toHaveAttribute(
      'value',
      '3'
    )
    await expect(canvas.getByRole('status')).toHaveTextContent('Archived interview recordings.')
  }
}
export const ChoosingRecorder: Story = {
  argTypes: taskControls,
  render: ({ className, style, dir }) => (
    <ChooseRecorder
      className={className}
      style={style}
      dir={dir}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.selectOptions(canvas.getByRole('combobox', { name: 'Recorder' }), 'travel')
    await expect(canvas.getByRole('meter', { name: 'Recorder battery' })).toHaveAttribute(
      'data-tone',
      'danger'
    )
    await expect(canvas.getByText(/20 minutes estimated recording time/)).toBeVisible()
  }
}
export const ChoosingStudyRoom: Story = {
  argTypes: taskControls,
  render: ({ className, style, dir }) => (
    <ChooseStudyRoom
      className={className}
      style={style}
      dir={dir}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.selectOptions(canvas.getByRole('combobox', { name: 'Study room' }), 'studio')
    await expect(canvas.getByRole('meter', { name: 'Room temperature' })).toHaveAttribute(
      'data-tone',
      'warning'
    )
    await expect(canvas.getByText('Window studio has 4 seats.')).toBeVisible()
  }
}

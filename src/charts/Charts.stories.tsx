import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { LineChart } from './index.js'
import {
  ReviewRecruitment,
  ReviewSessionLength,
  ShareExactCounts,
  TrackStudyEnrollment,
  UnderstandSessionMix,
  WaitForFirstSessions,
  type ChartsTaskOptions
} from '../../.storybook/examples/ChartsExamples.js'
const meta = {
  title: 'Components/Charts',
  args: { dir: 'ltr' },
  argTypes: {
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] },
    className: { control: 'text' },
    style: { control: 'object' }
  }
} satisfies Meta<ChartsTaskOptions>
export default meta
type Story = StoryObj<ChartsTaskOptions>
export const Default: Story = {
  render: args => (
    <LineChart
      {...args}
      label="Completed sessions"
      data={[
        { key: 'one', label: 'Round 1', values: { sessions: 12 } },
        { key: 'two', label: 'Round 2', values: { sessions: 24 } }
      ]}
      series={[{ key: 'sessions', label: 'Sessions' }]}
    />
  )
}
export const ReviewingRecruitment: Story = {
  render: args => <ReviewRecruitment {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.selectOptions(
      canvas.getByRole('combobox', { name: 'Research project' }),
      'atlas'
    )
    await expect(canvas.getByText('16 Atlas sessions completed in Round 4.')).toBeVisible()
    await userEvent.click(canvas.getByText('View chart data'))
    await expect(canvas.getByRole('table', { name: 'Atlas recruitment' })).toBeVisible()
  }
}
export const TrackingStudyEnrollment: Story = { render: args => <TrackStudyEnrollment {...args} /> }
export const UnderstandingSessionMix: Story = { render: args => <UnderstandSessionMix {...args} /> }
export const ReviewingSessionLength: Story = {
  render: args => <ReviewSessionLength {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('button', { name: 'Round 1, Moderated: 42 min' })
    ).toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: /Round 2, Unmoderated/ })).toBeNull()
    await userEvent.click(canvas.getByText('Show exact minutes'))
    await expect(canvas.getByRole('columnheader', { name: 'Research round' })).toBeVisible()
    await expect(canvas.getByRole('list', { name: 'Session methods' })).toBeVisible()
  }
}
export const WaitingForFirstSessions: Story = {
  render: args => <WaitForFirstSessions {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('No sessions completed yet.')).toBeVisible()
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Include pilot round' }))
    await expect(canvas.queryByText('No sessions completed yet.')).toBeNull()
    await expect(canvas.getByRole('button', { name: 'Pilot, Completed: 4' })).toBeInTheDocument()
  }
}
export const SharingExactCounts: Story = {
  render: ({ className, dir }) => (
    <ShareExactCounts
      className={className}
      dir={dir}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('table', { name: 'Sessions per round' })).toBeVisible()
    await expect(canvas.getByText('32 sessions')).toBeVisible()
  }
}

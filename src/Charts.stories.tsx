import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { LineChart } from './charts/index.js'
import {
  ReviewRecruitment,
  TrackStudyEnrollment,
  UnderstandSessionMix,
  type ChartsTaskOptions
} from '../.storybook/examples/ChartsExamples.js'
const meta = {
  title: 'Components/Charts',
  component: ReviewRecruitment,
  render: args => <ReviewRecruitment {...args} />
} satisfies Meta<ChartsTaskOptions>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: () => (
    <LineChart
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.selectOptions(
      canvas.getByRole('combobox', { name: 'Research project' }),
      'atlas'
    )
    await expect(canvas.getByText('16 Atlas sessions completed in Round 4.')).toBeVisible()
    await userEvent.click(canvas.getByText('View chart data'))
    await expect(canvas.getByRole('table', { name: 'Atlas recruitment data' })).toBeVisible()
  }
}
export const TrackingStudyEnrollment: Story = { render: args => <TrackStudyEnrollment {...args} /> }
export const UnderstandingSessionMix: Story = { render: args => <UnderstandSessionMix {...args} /> }

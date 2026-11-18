import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../Button/Button.js'
import { Tour, TourTrigger, type TourStep } from './Tour.js'

const steps: TourStep[] = [
  {
    target: '#tour-search',
    title: 'Find a project',
    description: 'Search projects by name or owner.'
  },
  { target: '#tour-share', title: 'Invite your team', description: 'Send a workspace invitation.' }
]

const meta = {
  title: 'Components/Tour',
  component: Tour,
  args: { steps },
  render: args => (
    <Tour
      {...args}
      className="grid max-w-sm gap-4"
    >
      <TourTrigger>Start tour</TourTrigger>
      <div className="flex flex-wrap gap-2">
        <Button
          id="tour-search"
          variant="outline"
        >
          Search projects
        </Button>
        <Button
          id="tour-share"
          variant="outline"
        >
          Invite teammates
        </Button>
      </div>
    </Tour>
  )
} satisfies Meta<typeof Tour>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const OnboardAGuest: Story = {
  args: {
    steps: [steps[0], { target: '#tour-billing', title: 'Manage subscription' }, steps[1]],
    formatProgress: (index, count) => `${index} of ${count} workspace tips`,
    doneLabel: 'Start working'
  }
}

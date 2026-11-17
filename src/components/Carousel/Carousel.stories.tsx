import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import {
  FeaturedStudies,
  ReviewStudyLibrary,
  PrepareStudyNotes,
  CompareResearchRounds,
  RotateStudyHighlights,
  type CarouselTaskOptions
} from '../../../.storybook/examples/CarouselExamples.js'
const meta = {
  title: 'Components/Carousel',
  component: FeaturedStudies,
  args: { dir: 'ltr', autoPlay: false, interval: 5000 },
  argTypes: {
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] },
    interval: { control: { type: 'number', min: 1000, step: 500 } },
    className: { control: 'text' },
    style: { control: 'object' }
  },
  render: args => <FeaturedStudies {...args} />
} satisfies Meta<CarouselTaskOptions>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(c.getByRole('button', { name: 'Previous' })).toBeDisabled()
    await userEvent.click(c.getByRole('button', { name: 'Next' }))
    await expect(c.getByRole('button', { name: 'Show slide 2 of 3' })).toHaveAttribute(
      'aria-current',
      'true'
    )
  }
}
export const ReviewingStudyLibrary: Story = {
  render: args => <ReviewStudyLibrary {...args} />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(c.getByRole('button', { name: 'Next study' }))
    await userEvent.click(c.getByRole('button', { name: 'Review Harbor reading' }))
    await expect(c.getByRole('status', { name: 'Study review feedback' })).toHaveTextContent(
      'Harbor reading opened for review.'
    )
  }
}
export const PreparingStudyNotes: Story = {
  render: args => <PrepareStudyNotes {...args} />,
  args: { dir: 'rtl' },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.type(
      c.getByRole('textbox', { name: 'Notes for Atlas onboarding' }),
      'Invite returning members'
    )
    await userEvent.click(c.getByRole('button', { name: 'Next study' }))
    await userEvent.click(c.getByRole('button', { name: 'Previous study' }))
    await userEvent.click(c.getByRole('button', { name: 'Save Atlas onboarding preparation' }))
    await expect(c.getByRole('status', { name: 'Preparation feedback' })).toHaveTextContent(
      'Preparation saved for Atlas onboarding: Invite returning members'
    )
  }
}
export const Controlled: Story = {
  render: args => <CompareResearchRounds {...args} />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(c.getByRole('checkbox', { name: 'Keep the selected study' }))
    await userEvent.click(c.getByRole('button', { name: 'Next study' }))
    await expect(c.getByRole('status', { name: 'Comparison feedback' })).toHaveTextContent(
      'The selected study is locked.'
    )
    await expect(c.getByRole('button', { name: 'Show slide 1 of 3' })).toHaveAttribute(
      'aria-current',
      'true'
    )
  }
}
export const RotatingStudyHighlights: Story = {
  render: args => <RotateStudyHighlights {...args} />,
  args: { autoPlay: true },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(c.getByRole('button', { name: 'Stop highlights' }))
    await userEvent.click(c.getByRole('button', { name: 'Show highlight 3 of 3' }))
    await expect(
      c.getByRole('group', { name: 'Orchard navigation, Highlight 3 of 3' })
    ).toHaveAttribute('data-selected')
    await expect(c.getByRole('button', { name: 'Resume highlights' })).toBeVisible()
  }
}

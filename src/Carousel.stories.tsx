import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { Carousel, CarouselViewport, CarouselPrevious, CarouselNext } from './index.js'
import {
  ReviewStudyLibrary,
  PrepareStudyNotes,
  CompareResearchRounds,
  type CarouselTaskOptions
} from '../.storybook/examples/CarouselExamples.js'
const meta = {
  title: 'Components/Carousel',
  component: ReviewStudyLibrary,
  args: { dir: 'ltr', autoPlay: false, interval: 5000 },
  render: args => <ReviewStudyLibrary {...args} />
} satisfies Meta<CarouselTaskOptions>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: () => (
    <Carousel
      aria-label="Featured studies"
      items={[
        { value: 'atlas', children: <p>Atlas onboarding</p> },
        { value: 'harbor', children: <p>Harbor reading</p> }
      ]}
    >
      <CarouselViewport />
      <div>
        <CarouselPrevious>Previous</CarouselPrevious>
        <CarouselNext>Next</CarouselNext>
      </div>
    </Carousel>
  )
}
export const ReviewingStudyLibrary: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Next study' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Review Harbor reading' }))
    await expect(canvas.getByRole('status', { name: 'Study review feedback' })).toHaveTextContent(
      'Harbor reading opened for review.'
    )
  }
}
export const PreparingStudyNotes: Story = {
  render: args => <PrepareStudyNotes {...args} />,
  args: { dir: 'rtl' }
}
export const Controlled: Story = { render: args => <CompareResearchRounds {...args} /> }

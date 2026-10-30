import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { ButtonGroup, Button } from './index.js'
import { MotionProvider } from './motion/react.js'
import {
  EditProjectActions,
  PublishReportActions,
  BrowseReviewWeeks,
  type ButtonGroupTaskOptions
} from '../.storybook/examples/ButtonGroupExamples.js'
const meta = {
  title: 'Components/ButtonGroup',
  component: EditProjectActions,
  args: {
    orientation: 'horizontal',
    dir: 'ltr',
    controlSize: 'medium',
    disabled: false,
    pending: false,
    motion: 'inherit'
  },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] },
    controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] },
    motion: { control: 'inline-radio', options: ['inherit', 'off'] },
    style: { control: 'object' }
  },
  render: args => (
    <MotionProvider>
      <EditProjectActions {...args} />
    </MotionProvider>
  )
} satisfies Meta<ButtonGroupTaskOptions>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: ({ orientation, dir, className, style, ...buttons }) => (
    <MotionProvider>
      <ButtonGroup
        aria-label="Record actions"
        orientation={orientation}
        dir={dir}
        className={className}
        style={style}
      >
        <Button
          {...buttons}
          variant="outline"
        >
          Save
        </Button>
        <Button
          {...buttons}
          variant="outline"
        >
          Preview
        </Button>
        <Button
          {...buttons}
          variant="outline"
        >
          Share
        </Button>
      </ButtonGroup>
    </MotionProvider>
  )
}
export const EditingProject: Story = {
  play: async ({ canvasElement, args }) => {
    if (args.disabled || args.pending) return
    const canvas = within(canvasElement)
    await userEvent.clear(canvas.getByRole('textbox', { name: 'Project title' }))
    await userEvent.type(canvas.getByRole('textbox', { name: 'Project title' }), 'North star')
    await userEvent.click(canvas.getByRole('button', { name: 'Save project' }))
    await expect(canvas.getByText('Saved North star.')).toBeVisible()
  }
}
export const PublishingReport: Story = {
  render: args => (
    <MotionProvider>
      <PublishReportActions {...args} />
    </MotionProvider>
  )
}
export const BrowsingReviewWeeks: Story = {
  render: args => (
    <MotionProvider>
      <BrowseReviewWeeks {...args} />
    </MotionProvider>
  )
}

import type { Meta, StoryObj } from '@storybook/react-vite'
import { ButtonGroup, Button, Stack } from '../../index.js'
import { MotionProvider } from '../../motion/react.js'
import { PublishReportActions } from '../../../.storybook/examples/ButtonGroupExamples.js'

const meta = {
  title: 'Components/ButtonGroup',
  component: ButtonGroup,
  args: {
    orientation: 'horizontal',
    dir: 'ltr'
  },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] }
  }
} satisfies Meta<typeof ButtonGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: args => (
    <MotionProvider>
      <Stack
        orientation={args.orientation}
        dir={args.dir}
        align="start"
        wrap
      >
        <ButtonGroup
          aria-label="Record actions"
          {...args}
        >
          <Button variant="outline">Save</Button>
          <Button variant="outline">Preview</Button>
          <Button variant="outline">Share</Button>
        </ButtonGroup>
        <Button variant="outline">Export</Button>
        <Button variant="outline">Archive</Button>
      </Stack>
    </MotionProvider>
  )
}

export const SplitAction: Story = {
  render: ({ orientation, dir, className, style }) => (
    <MotionProvider>
      <PublishReportActions
        orientation={orientation}
        dir={dir}
        className={className}
        style={style}
      />
    </MotionProvider>
  )
}

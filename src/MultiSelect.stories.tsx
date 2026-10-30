import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor } from 'storybook/test'
import { MotionProvider } from './motion/react.js'
import {
  AssignProjectReviewers,
  FilterReleaseBoard,
  KeepLeadReviewer,
  type MultiTaskOptions
} from '../.storybook/examples/MultiSelectExamples.js'
const meta = {
  title: 'Components/MultiSelect',
  component: AssignProjectReviewers,
  args: {
    controlSize: 'medium',
    disabled: false,
    readOnly: false,
    loading: false,
    fail: false,
    dir: 'ltr',
    initialOpen: false,
    initialValues: ['ana'],
    motion: 'inherit',
    sideOffset: 4,
    collisionPadding: 8
  },
  argTypes: {
    controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] },
    motion: { control: 'inline-radio', options: ['inherit', 'off'] },
    initialValues: { control: 'object' },
    style: { control: 'object' }
  },
  render: args => (
    <MotionProvider>
      <AssignProjectReviewers
        key={JSON.stringify([args.initialOpen, args.initialValues])}
        {...args}
      />
    </MotionProvider>
  )
} satisfies Meta<MultiTaskOptions>
export default meta
type Story = StoryObj<typeof meta>
async function settled(canvas: HTMLElement) {
  await waitFor(
    () => {
      const popup = canvas.querySelector<HTMLElement>('[data-slot~="combobox-content"]')!
      expect(popup.matches(':popover-open')).toBe(true)
      expect(getComputedStyle(popup).opacity).toBe('1')
    },
    { timeout: 4000 }
  )
}
export const Default: Story = {}
export const AssigningProjectReviewers: Story = {
  args: { initialOpen: true },
  play: async ({ canvasElement }) => settled(canvasElement)
}
export const FilteringReleaseBoard: Story = {
  args: { initialOpen: true, initialValues: ['design'] },
  render: args => (
    <MotionProvider>
      <FilterReleaseBoard
        key={JSON.stringify([args.initialOpen, args.initialValues])}
        {...args}
      />
    </MotionProvider>
  ),
  play: async ({ canvasElement }) => settled(canvasElement)
}
export const KeepingLeadReviewer: Story = {
  args: { initialOpen: true },
  render: args => (
    <MotionProvider>
      <KeepLeadReviewer
        key={JSON.stringify([args.initialOpen, args.initialValues])}
        {...args}
      />
    </MotionProvider>
  ),
  play: async ({ canvasElement }) => settled(canvasElement)
}

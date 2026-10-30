import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { Kbd } from './index.js'
import { MotionProvider } from './motion/react.js'
import {
  FindProjectWithShortcut,
  DuplicateNoteWithShortcut,
  SaveNoteWithShortcut,
  type KbdTaskOptions
} from '../.storybook/examples/KbdExamples.js'
const meta = {
  title: 'Components/Kbd',
  component: FindProjectWithShortcut,
  args: { modifier: 'Control' },
  argTypes: {
    modifier: { control: 'inline-radio', options: ['Control', 'Command'] },
    className: { control: 'text' },
    style: { control: 'object' }
  },
  render: args => (
    <MotionProvider>
      <FindProjectWithShortcut {...args} />
    </MotionProvider>
  )
} satisfies Meta<KbdTaskOptions>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: args => (
    <Kbd
      className={args.className}
      style={args.style}
    >
      Esc
    </Kbd>
  )
}
export const FindingProject: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Find project' }))
    await expect(canvas.getByRole('textbox', { name: 'Project search' })).toHaveFocus()
    await userEvent.type(canvas.getByRole('textbox', { name: 'Project search' }), 'Reader')
    await expect(canvas.getByText('Reader study')).toBeVisible()
  }
}
export const DuplicatingStudyNote: Story = {
  render: args => (
    <MotionProvider>
      <DuplicateNoteWithShortcut {...args} />
    </MotionProvider>
  )
}
export const SavingStudyNote: Story = {
  render: args => (
    <MotionProvider>
      <SaveNoteWithShortcut {...args} />
    </MotionProvider>
  )
}

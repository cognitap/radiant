import type { Meta, StoryObj } from '@storybook/react-vite'
import { CopyButton } from './CopyButton.js'
import { InlineCode } from '../InlineCode/InlineCode.js'
import { MotionProvider } from '../../motion/react.js'

const meta = {
  title: 'Components/CopyButton',
  component: CopyButton,
  args: {
    value: 'INV-2408',
    children: 'Copy invoice number',
    copiedText: 'Invoice number copied',
    errorText: 'Could not copy. Select the number to copy it.'
  },
  argTypes: { children: { control: 'text' } },
  render: args => (
    <MotionProvider>
      <div
        className="relative grid justify-items-start gap-2"
        style={{
          width: '16rem',
          maxWidth: '100%',
          gridTemplateRows: 'auto auto minmax(2lh, auto)'
        }}
      >
        <InlineCode>{args.value}</InlineCode>
        <CopyButton {...args} />
      </div>
    </MotionProvider>
  )
} satisfies Meta<typeof CopyButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

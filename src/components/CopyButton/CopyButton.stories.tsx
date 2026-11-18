import type { Meta, StoryObj } from '@storybook/react-vite'
import { CopyButton } from './CopyButton.js'

const meta = {
  title: 'Components/CopyButton',
  component: CopyButton,
  args: { value: 'https://example.com/workspace', children: 'Copy link' }
} satisfies Meta<typeof CopyButton>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const CopyAnOrderReference: Story = {
  render: () => (
    <div className="grid justify-items-start gap-2">
      <span className="font-mono text-sm">ORD-2028</span>
      <CopyButton
        value="ORD-2028"
        variant="outline"
        copiedText="Order reference copied."
        errorText="Copy failed. Select the order reference to copy it."
        resetDelay={4000}
      >
        Copy order reference
      </CopyButton>
    </div>
  )
}

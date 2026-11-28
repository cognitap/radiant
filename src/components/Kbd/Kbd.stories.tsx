import type { Meta, StoryObj } from '@storybook/react-vite'
import { Kbd, KbdGroup } from '../../index.js'

const meta = {
  title: 'Components/Kbd',
  component: Kbd,
  args: { children: 'Esc' },
  argTypes: { children: { control: 'text' } }
} satisfies Meta<typeof Kbd>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const KeyCombination: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <KbdGroup>
      <Kbd>Control</Kbd>+<Kbd>K</Kbd>
    </KbdGroup>
  )
}

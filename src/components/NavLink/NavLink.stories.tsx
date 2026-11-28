import type { Meta, StoryObj } from '@storybook/react-vite'
import { NavLinkExample } from '../../../.storybook/examples/NavLinkExamples.js'

const meta = {
  title: 'Components/NavLink',
  component: NavLinkExample,
  args: { controlSize: 'medium', dir: 'ltr' },
  argTypes: {
    controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] }
  },
  parameters: { controls: { include: ['controlSize', 'dir'] } }
} satisfies Meta<typeof NavLinkExample>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithGroup: Story = {
  args: { grouped: true }
}

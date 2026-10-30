import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  TooltipControlledExample,
  TooltipExample,
  TooltipIconButtonExample,
  TooltipOpenDelayExample
} from '../.storybook/examples/TooltipExamples.js'

const meta = {
  title: 'Components/Tooltip',
  component: TooltipExample,
  args: {
    openDelay: 500,
    closeDelay: 150,
    side: 'top',
    align: 'center',
    sideOffset: 8,
    collisionPadding: 8
  },
  argTypes: {
    openDelay: { control: { type: 'number', min: 0 } },
    closeDelay: { control: { type: 'number', min: 0 } },
    side: { control: 'inline-radio', options: ['top', 'right', 'bottom', 'left'] },
    align: { control: 'inline-radio', options: ['start', 'center', 'end'] },
    sideOffset: { control: { type: 'number', min: 0 } },
    collisionPadding: { control: { type: 'number', min: 0 } }
  },
  render: (args, { viewMode }) => (
    <TooltipExample
      {...args}
      defaultOpen={viewMode !== 'docs'}
    />
  ),
  parameters: {
    docs: {
      description: {
        component:
          'Supplementary descriptions for Button triggers. Focus opens immediately; mouse/pen hover waits openDelay (500ms). Content is a noninteractive span with role=tooltip, described by the trigger. Escape dismisses without moving focus and suppresses reopening until the interaction ends. The pointer can cross the gap and hover the description. Touch does not open a tooltip; essential information must remain visible. Use Popover for interactive content. Local portals preserve theme and modal ancestry; placement and optional motion reuse the popup foundation.'
      }
    }
  }
} satisfies Meta<typeof TooltipExample>
export default meta
type Story = StoryObj<typeof meta>

const fixed = { parameters: { controls: { disable: true } } }

export const Default: Story = {}
export const IconButton: Story = { ...fixed, render: () => <TooltipIconButtonExample /> }
export const OpenDelay: Story = { ...fixed, render: () => <TooltipOpenDelayExample /> }
export const Controlled: Story = { ...fixed, render: () => <TooltipControlledExample /> }
export const Customisation: Story = {
  args: {
    side: 'right',
    align: 'start',
    style: {
      '--rad-tooltip-max-width': '14rem',
      '--rad-tooltip-padding': '1rem',
      '--rad-tooltip-radius': '1rem'
    }
  }
}

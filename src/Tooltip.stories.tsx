import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipPortal } from './index.js'
const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  parameters: {
    docs: {
      description: {
        component:
          'Supplementary descriptions for Button triggers. Focus opens immediately; mouse/pen hover waits openDelay (500ms). Content is a noninteractive span with role=tooltip, described by the trigger. Escape dismisses without moving focus and suppresses reopening until the interaction ends. The pointer can cross the gap and hover the description. Touch does not open a tooltip; essential information must remain visible. Use Popover for interactive content. Local portals preserve theme and modal ancestry; placement and optional motion reuse the popup foundation.'
      }
    }
  }
} satisfies Meta<typeof Tooltip>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: (_, { viewMode }) => (
    <Tooltip defaultOpen={viewMode !== 'docs'}>
      <TooltipTrigger variant="outline">Export report</TooltipTrigger>
      <TooltipPortal>
        <TooltipContent>Download the report as a CSV file.</TooltipContent>
      </TooltipPortal>
    </Tooltip>
  )
}
export const Customisation: Story = {
  render: (_, { viewMode }) => (
    <Tooltip defaultOpen={viewMode !== 'docs'}>
      <TooltipTrigger
        tone="neutral"
        variant="outline"
      >
        Archive project
      </TooltipTrigger>
      <TooltipContent
        side="right"
        align="start"
        style={{
          '--rad-tooltip-max-width': '14rem',
          '--rad-tooltip-padding': '1rem',
          '--rad-tooltip-radius': '1rem'
        }}
      >
        Keep the project without showing it in your active list.
      </TooltipContent>
    </Tooltip>
  )
}
export const HoverAndFocus: Story = {
  render: () => (
    <Tooltip openDelay={300}>
      <TooltipTrigger
        iconOnly
        aria-label="Report details"
      >
        ?
      </TooltipTrigger>
      <TooltipContent>Reports include completed work only.</TooltipContent>
    </Tooltip>
  )
}

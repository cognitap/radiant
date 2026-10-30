import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  PopoverExample,
  DeliveryTimePopover,
  PinnablePopover
} from '../.storybook/examples/PopoverExamples.js'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
  PopoverPortal,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose
} from './index.js'

const meta = {
  title: 'Components/Popover',
  component: PopoverExample,
  args: { side: 'bottom', align: 'start', sideOffset: 8, collisionPadding: 8, motion: 'inherit' },
  argTypes: {
    side: { control: 'inline-radio', options: ['top', 'right', 'bottom', 'left'] },
    align: { control: 'inline-radio', options: ['start', 'center', 'end'] },
    motion: { control: 'inline-radio', options: ['inherit', 'off'] }
  },
  parameters: {
    docs: {
      description: {
        component:
          'Nonmodal anchored content with native top-layer rendering. Popover owns open/defaultOpen; Trigger and Close compose Button. Content stays a div and takes its own role, accessible name, relationships, native props, style and ref. A popover alone supplies no menu/listbox behavior. Opening retains trigger focus; initialFocusRef can focus a descendant. Native source navigation puts content after the trigger in Tab order; Tab can leave and dismiss without a focus trap. Escape and Close restore focus when it is inside; outside pointer/focus dismissal preserves the new target. A controlled owner may refuse close, including native hide. Local portals preserve theme, forms and modal ancestry. Placement flips and shifts within the visual viewport; start/end follow RTL on top/bottom sides. Content exposes effective data-side/data-align and open/closed data-state. components.popover and --rad-popover-* variables customize the shared surface. Optional MotionProvider entry feedback honors reduced/off motion; close never waits for an animation.'
      }
    }
  }
} satisfies Meta<typeof PopoverExample>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args, { viewMode }) => (
    <PopoverExample
      {...args}
      defaultOpen={viewMode !== 'docs'}
    />
  )
}
export const EditingAValue: Story = { render: () => <DeliveryTimePopover /> }
export const Controlled: Story = { render: () => <PinnablePopover /> }
export const Placement: Story = {
  args: { side: 'top', align: 'center', sideOffset: 12 },
  render: (args, { viewMode }) => (
    <div className="grid min-h-80 place-items-center">
      <PopoverExample
        {...args}
        defaultOpen={viewMode !== 'docs'}
      />
    </div>
  )
}
export const Nested: Story = {
  render: (_, { viewMode }) => (
    <Popover defaultOpen={viewMode !== 'docs'}>
      <PopoverTrigger>Shipping information</PopoverTrigger>
      <PopoverContent>
        <p className="m-0">Choose the information you need.</p>
        <Popover>
          <PopoverTrigger variant="outline">Returns policy</PopoverTrigger>
          <PopoverPortal>
            <PopoverContent>
              <p className="m-0">Returns are accepted within thirty days.</p>
              <PopoverClose>Back to shipping</PopoverClose>
            </PopoverContent>
          </PopoverPortal>
        </Popover>
        <PopoverClose
          variant="outline"
          tone="neutral"
        >
          Close shipping
        </PopoverClose>
      </PopoverContent>
    </Popover>
  )
}
export const InsideDialog: Story = {
  render: (_, { viewMode }) => (
    <Dialog defaultOpen={viewMode !== 'docs'}>
      <DialogTrigger>Open report preferences</DialogTrigger>
      <DialogContent>
        <DialogTitle>Report preferences</DialogTitle>
        <DeliveryTimePopover />
        <DialogClose>Done</DialogClose>
      </DialogContent>
    </Dialog>
  )
}
export const Customisation: Story = {
  args: {
    className: 'font-medium',
    style: {
      '--rad-popover-width': '18rem',
      '--rad-popover-radius': '1.5rem',
      '--rad-popover-padding': '1rem'
    }
  },
  render: (args, { viewMode }) => (
    <PopoverExample
      {...args}
      defaultOpen={viewMode !== 'docs'}
    />
  )
}

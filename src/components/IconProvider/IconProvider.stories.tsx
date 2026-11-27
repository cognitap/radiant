import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  GripVertical,
  LoaderCircle,
  Minus,
  X
} from 'lucide-react'
import { expect, within } from 'storybook/test'
import {
  Button,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Combobox,
  DatePicker,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Field,
  IconProvider,
  Select,
  SortableList,
  SortableListItem,
  Spinner,
  Stack,
  type IconSet
} from '../../index.js'

const lucideIcons: IconSet = {
  check: Check,
  indeterminate: Minus,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  close: X,
  calendar: Calendar,
  grip: GripVertical,
  spinner: LoaderCircle
}

const teams = [
  { value: 'design', label: 'Design', textValue: 'Design' },
  { value: 'research', label: 'Research', textValue: 'Research' }
]

const meta = {
  title: 'Components/IconProvider',
  component: IconProvider,
  args: { icons: lucideIcons },
  parameters: {
    docs: {
      description: {
        component:
          'Hands Radiant one icon set. Checkbox marks, select and combobox chevrons, the disclosure marker, the calendar trigger and month buttons, sortable grips, close buttons and spinners draw the supplied icons in the control’s color and size; without a provider they keep their built-in drawings.'
      }
    }
  },
  render: args => (
    <IconProvider {...args}>
      <Stack
        gap="normal"
        className="w-80 max-w-full"
      >
        <Stack gap="tight">
          <Checkbox
            label="Email updates"
            defaultChecked
          />
          <Checkbox
            label="All projects"
            indeterminate
          />
        </Stack>
        <Field label="Team">
          <Select
            items={teams}
            defaultValue="design"
          />
        </Field>
        <Field label="Reviewer">
          <Combobox
            items={[
              { value: 'ada', label: 'Ada' },
              { value: 'grace', label: 'Grace' }
            ]}
            defaultValue="ada"
          />
        </Field>
        <Field label="Due date">
          <DatePicker defaultValue="2028-02-29" />
        </Field>
        <Collapsible>
          <CollapsibleTrigger>Details</CollapsibleTrigger>
          <CollapsibleContent>Ships in two days.</CollapsibleContent>
        </Collapsible>
        <SortableList
          aria-label="Priorities"
          defaultValue={['invoice', 'review']}
          instructionsText="Press Space or Enter to pick up, the arrow keys to move, and Space or Enter to drop."
          pickUpText={item => `Picked up ${item}.`}
          moveText={(item, index) => `${item}, position ${index + 1}.`}
          dropText={item => `Dropped ${item}.`}
          cancelText={item => `Cancelled ${item}.`}
        >
          <SortableListItem value="invoice">Send the invoice</SortableListItem>
          <SortableListItem value="review">Review the proposal</SortableListItem>
        </SortableList>
        <div className="flex flex-wrap items-center gap-3">
          <Spinner label="Loading" />
          <Button pending>Saving</Button>
          <Dialog>
            <DialogTrigger>Open dialog</DialogTrigger>
            <DialogContent>
              <DialogClose
                aria-label="Close"
                style={{ justifySelf: 'end' }}
              />
              <DialogTitle>Icons</DialogTitle>
              <DialogDescription>The close button draws the supplied icon.</DialogDescription>
            </DialogContent>
          </Dialog>
        </div>
      </Stack>
    </IconProvider>
  )
} satisfies Meta<typeof IconProvider>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(c.getByRole('checkbox', { name: 'Email updates' })).toBeChecked()
    await expect(canvasElement.querySelector('.lucide-check')).toBeTruthy()
    await expect(canvasElement.querySelector('.lucide-grip-vertical')).toBeTruthy()
  }
}

export const BuiltInIcons: Story = {
  args: { icons: {} }
}

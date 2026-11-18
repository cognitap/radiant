import type { Meta, StoryObj } from '@storybook/react-vite'
import { LocaleProvider } from '../LocaleProvider/LocaleProvider.js'
import { Timeline, TimelineItem } from './Timeline.js'

const meta = {
  title: 'Components/Timeline',
  component: Timeline,
  parameters: {
    docs: {
      description: {
        component:
          'Show a sequence of events with a readable timestamp and machine-readable dateTime for each item. Mark one event active to highlight the current position.'
      }
    }
  }
} satisfies Meta<typeof Timeline>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Timeline
      aria-label="Shipment activity"
      className="w-full max-w-md"
    >
      <TimelineItem
        label="Order confirmed"
        dateTime="2026-05-12T09:15:00"
        time="9:15 AM"
      >
        Payment received and the packing list is ready.
      </TimelineItem>
      <TimelineItem
        label="Parcel collected"
        dateTime="2026-05-12T12:30:00"
        time="12:30 PM"
        tone="accent"
        icon="✓"
      >
        The carrier picked up the parcel.
      </TimelineItem>
      <TimelineItem
        label="Out for delivery"
        dateTime="2026-05-13T08:10:00"
        time="8:10 AM"
        tone="accent"
        active
      >
        Expected by 5 PM.
      </TimelineItem>
    </Timeline>
  )
}

export const ReviewAnIncident: Story = {
  render: () => (
    <Timeline
      aria-label="Incident log"
      className="w-full max-w-md"
    >
      <TimelineItem
        label="Error rate alert"
        dateTime="2026-05-12T15:01:00Z"
        time="15:01 UTC"
        tone="danger"
        icon="!"
      >
        Checkout requests started returning errors.
      </TimelineItem>
      <TimelineItem
        label="Traffic restored"
        dateTime="2026-05-12T15:20:00Z"
        time="15:20 UTC"
        tone="accent"
        icon="✓"
        active
      >
        The previous build is serving all requests.
      </TimelineItem>
    </Timeline>
  )
}

export const FollowADeliveryInHebrew: Story = {
  render: () => (
    <LocaleProvider locale="he-IL">
      <Timeline aria-label="מעקב משלוח">
        <TimelineItem
          label="ההזמנה התקבלה"
          dateTime="2026-05-12T08:00:00"
          time="08:00"
        />
        <TimelineItem
          label="החבילה בדרך"
          dateTime="2026-05-12T10:15:00"
          time="10:15"
          active
          tone="accent"
        />
      </Timeline>
    </LocaleProvider>
  )
}

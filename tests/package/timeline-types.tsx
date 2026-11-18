import { Timeline, TimelineItem, type TimelineItemProps } from '@cognitap/radiant'

const event: TimelineItemProps = {
  label: 'Delivered',
  dateTime: '2026-05-12',
  time: 'May 12',
  active: true
}
export const history = (
  <Timeline aria-label="Track shipment">
    <TimelineItem {...event}>Arrived at the destination.</TimelineItem>
  </Timeline>
)

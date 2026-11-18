import { Button, Indicator, type IndicatorTargetProps } from '@cognitap/radiant'

export const inbox = (
  <Indicator
    label="Inbox"
    statusText="120 unread messages"
    count={120}
    position="bottom-start"
  >
    {(props: IndicatorTargetProps) => <Button {...props}>Inbox</Button>}
  </Indicator>
)

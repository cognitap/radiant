import { TimeInput, type TimeInputProps } from '@cognitap/radiant'
export const localTime = (
  <TimeInput
    aria-label="Start"
    defaultValue={null}
    hourCycle="h12"
    showSeconds
    step={5}
    style={{ '--rad-time-input-period-indicator-color': 'var(--rad-color-accent)' }}
    onValueChange={iso => iso?.toUpperCase()}
  />
)
// @ts-expect-error A controlled time and a default cannot be supplied together.
export const conflict: TimeInputProps = { value: '13:00', defaultValue: '08:00' }

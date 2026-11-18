import {
  DateRangePicker,
  type DateRangePickerProps,
  type DateRangePreset,
  type DateRangeValue
} from '@cognitap/radiant'
const range: DateRangeValue = { start: '2028-02-29', end: null }
const preset: DateRangePreset = { label: 'March', start: '2028-03-01', end: '2028-03-31' }
export const picker = (
  <DateRangePicker
    startLabel="Start"
    endLabel="End"
    startName="from"
    endName="to"
    defaultFocusedDate="2028-03-01"
    value={range}
    presets={[preset]}
    onValueChange={next => next.end?.toUpperCase()}
  />
)
// @ts-expect-error Controlled and uncontrolled ranges cannot be supplied together.
export const invalid: DateRangePickerProps = {
  startLabel: 'Start',
  endLabel: 'End',
  value: range,
  defaultValue: range
}

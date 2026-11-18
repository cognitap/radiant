import { Calendar, type CalendarProps, type CalendarRange } from '@cognitap/radiant'
export const single = (
  <Calendar
    aria-label="Day"
    value="2028-02-29"
    onValueChange={date => date?.toUpperCase()}
  />
)
const range: CalendarRange = { start: '2028-02-29', end: null }
export const multiple = (
  <Calendar
    aria-label="Stay"
    type="range"
    defaultValue={range}
    onValueChange={dates => dates?.end}
  />
)
// @ts-expect-error A range calendar has two endpoints.
export const invalid: CalendarProps = { 'aria-label': 'Stay', type: 'range', value: '2028-02-29' }

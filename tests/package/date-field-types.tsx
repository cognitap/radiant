import { DateField, type DateFieldProps } from '@cognitap/radiant'

const props: DateFieldProps = {
  name: 'invoice',
  value: '2028-02-29',
  onValueChange: iso => iso?.split('-')
}

export const dateField = (
  <DateField
    {...props}
    aria-label="Invoice date"
  />
)
// @ts-expect-error Calendar trigger labels only apply to the picker.
export const calendarLabel = <DateField calendarLabel="Choose date" />

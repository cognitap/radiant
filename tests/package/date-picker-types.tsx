import { DatePicker, Field, type DatePickerProps } from '@cognitap/radiant'
export const formDate = (
  <Field label="Start">
    <DatePicker
      name="start"
      defaultValue={null}
      calendar="buddhist"
      onValueChange={iso => iso?.toUpperCase()}
    />
  </Field>
)
// @ts-expect-error Controlled and uncontrolled owners are mutually exclusive.
export const conflicting: DatePickerProps = { value: '2028-01-01', defaultValue: '2028-01-02' }

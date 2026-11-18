import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { DatePicker } from './DatePicker.js'
import { Field } from '../Field/Field.js'
import { LocaleProvider } from '../LocaleProvider/LocaleProvider.js'
import { Button } from '../Button/Button.js'

const meta = {
  title: 'Components/DatePicker',
  component: DatePicker,
  args: { 'aria-label': 'Appointment date' }
} satisfies Meta<typeof DatePicker>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const WithField: Story = {
  render: () => (
    <Field
      label="Appointment date"
      description="Type the date or choose it on the calendar."
      required
    >
      <DatePicker />
    </Field>
  )
}
export const SharedControlSizes: Story = {
  render: () => (
    <div className="grid gap-3">
      {(['small', 'medium', 'large'] as const).map(size => (
        <Field
          key={size}
          label={size}
        >
          <DatePicker controlSize={size} />
        </Field>
      ))}
    </div>
  )
}

function Booking() {
  const [value, setValue] = useState<string | null>('2028-02-29')
  const [submitted, submit] = useState('')
  return (
    <form
      className="grid gap-3"
      onSubmit={event => {
        event.preventDefault()
        submit(String(new FormData(event.currentTarget).get('arrival')))
      }}
    >
      <Field
        label="Arrival"
        required
      >
        <DatePicker
          name="arrival"
          value={value}
          onValueChange={setValue}
        />
      </Field>
      <Button type="submit">Confirm arrival</Button>
      <output aria-live="polite">{submitted}</output>
    </form>
  )
}
export const Controlled: Story = { render: () => <Booking /> }
export const LocalizedEntry: Story = {
  render: () => (
    <div className="grid gap-3">
      <LocaleProvider locale="fr-FR">
        <Field label="Date de départ">
          <DatePicker
            defaultValue="2028-02-29"
            calendarLabel="Choisir une date"
          />
        </Field>
      </LocaleProvider>
      <LocaleProvider locale="th-TH-u-nu-thai">
        <Field label="วันที่">
          <DatePicker
            defaultValue="2028-02-29"
            calendarLabel="เลือกวันที่"
          />
        </Field>
      </LocaleProvider>
    </div>
  )
}

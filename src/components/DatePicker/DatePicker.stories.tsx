import { useId, useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { DatePicker } from './DatePicker.js'
import { Field } from '../Field/Field.js'
import { LocaleProvider } from '../LocaleProvider/LocaleProvider.js'
import { Button } from '../Button/Button.js'
import { Checkbox } from '../Checkbox/Checkbox.js'

const meta = {
  title: 'Components/DatePicker',
  component: DatePicker,
  args: { 'aria-label': 'Appointment date' },
  parameters: {
    docs: {
      description: {
        component:
          'Type a localized date or choose one from the calendar. The named field submits an ISO date. An empty picker uses `defaultFocusedDate` for the initial calendar focus and `today` to mark the current day. Style the field with `className` or target its `date-picker-trigger` slot. Calendar days and month buttons use Calendar’s slots.'
      }
    }
  },
  argTypes: {
    today: { control: 'text' },
    defaultFocusedDate: { control: 'text' },
    calendar: { control: 'select', options: ['gregory', 'buddhist'] },
    firstDayOfWeek: { control: 'select', options: [1, 2, 3, 4, 5, 6, 7] },
    controlSize: { control: 'select', options: ['small', 'medium', 'large'] }
  }
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

function ConfirmArrival() {
  const formId = useId()
  const arrivalInput = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState<string | null>('2028-02-29')
  const [submitted, submit] = useState('')
  return (
    <div className="grid gap-3">
      <Field
        label="Arrival"
        description="Type a date or choose it in the calendar."
        required
      >
        <DatePicker
          ref={arrivalInput}
          form={formId}
          name="arrival"
          value={value}
          onValueChange={setValue}
          readOnly={submitted !== ''}
        />
      </Field>
      <form
        id={formId}
        className="flex flex-wrap gap-2"
        onSubmit={event => {
          event.preventDefault()
          submit(String(new FormData(event.currentTarget).get('arrival')))
        }}
      >
        <Button
          type="submit"
          disabled={submitted !== ''}
        >
          Confirm arrival
        </Button>
        <Button
          variant="outline"
          disabled={submitted === ''}
          onClick={() => {
            submit('')
            arrivalInput.current?.focus()
          }}
        >
          Edit arrival
        </Button>
      </form>
      <output aria-live="polite">{submitted && 'Arrival confirmed for ' + submitted}</output>
    </div>
  )
}
export const Controlled: Story = { render: () => <ConfirmArrival /> }

function BookAnInspection() {
  const helpId = useId()
  return (
    <div className="grid gap-2">
      <p id={helpId}>Inspections take place on weekdays in March and April.</p>
      <DatePicker
        aria-label="Inspection date"
        aria-describedby={helpId}
        today="2028-02-28"
        defaultFocusedDate="2028-04-03"
        min="2028-03-01"
        max="2028-04-30"
        isDateDisabled={date => [0, 6].includes(new Date(date).getUTCDay())}
        firstDayOfWeek={1}
        calendarLabel="Choose an inspection date"
        previousMonthLabel="Previous inspection month"
        nextMonthLabel="Next inspection month"
      />
    </div>
  )
}
export const BookAnAvailableDate: Story = { render: () => <BookAnInspection /> }

function Reschedule() {
  const [reschedule, setReschedule] = useState(false)
  return (
    <div className="grid gap-3">
      <Checkbox
        label="Reschedule this delivery"
        checked={reschedule}
        onChange={event => setReschedule(event.currentTarget.checked)}
      />
      <Field label="Delivery date">
        <DatePicker
          disabled={!reschedule}
          defaultValue="2028-03-07"
          min="2028-03-07"
        />
      </Field>
    </div>
  )
}
export const RescheduleADelivery: Story = { render: () => <Reschedule /> }

export const LocalizedEntry: Story = {
  render: () => (
    <div className="grid gap-3">
      <LocaleProvider locale="fr-FR">
        <Field label="Date de départ">
          <DatePicker
            defaultValue="2028-02-29"
            calendarLabel="Choisir une date"
            previousMonthLabel="Mois précédent"
            nextMonthLabel="Mois suivant"
          />
        </Field>
      </LocaleProvider>
      <LocaleProvider locale="th-TH">
        <Field label="วันที่">
          <DatePicker
            defaultValue="2028-02-29"
            locale="th-TH-u-nu-thai"
            calendar="buddhist"
            calendarLabel="เลือกวันที่"
            previousMonthLabel="เดือนก่อนหน้า"
            nextMonthLabel="เดือนถัดไป"
          />
        </Field>
      </LocaleProvider>
    </div>
  )
}

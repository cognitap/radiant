import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { TimeInput } from './TimeInput.js'
import { Field } from '../Field/Field.js'
import { DatePicker } from '../DatePicker/DatePicker.js'
import { Button } from '../Button/Button.js'
import { LocaleProvider } from '../LocaleProvider/LocaleProvider.js'
const meta = {
  title: 'Components/TimeInput',
  component: TimeInput,
  args: { 'aria-label': 'Start time' }
} satisfies Meta<typeof TimeInput>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const WithField: Story = {
  render: () => (
    <Field
      label="Arrival time"
      description="Type a time or use the up and down arrows."
      required
    >
      <TimeInput />
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
          <TimeInput
            controlSize={size}
            defaultValue="09:30"
          />
        </Field>
      ))}
    </div>
  )
}
function Appointment() {
  const [value, setValue] = useState<string | null>('09:30')
  const [receipt, submit] = useState('')
  return (
    <form
      className="grid gap-3"
      onSubmit={event => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        submit(data.get('date') + 'T' + data.get('time'))
      }}
    >
      <Field
        label="Appointment date"
        required
      >
        <DatePicker
          name="date"
          defaultValue="2028-03-01"
        />
      </Field>
      <Field
        label="Appointment time"
        required
        description="Appointments start every 15 minutes, from 09:00 to 22:00."
      >
        <TimeInput
          name="time"
          min="09:00"
          max="22:00"
          step={900}
          value={value}
          onValueChange={setValue}
        />
      </Field>
      <Button type="submit">Confirm appointment</Button>
      <output aria-live="polite">{receipt}</output>
    </form>
  )
}
export const Controlled: Story = { render: () => <Appointment /> }
export const WithSeconds: Story = {
  args: { defaultValue: '14:15:30', showSeconds: true, hourCycle: 'h23', step: 5 }
}
export const LocalizedTimes: Story = {
  render: () => (
    <div className="grid gap-3">
      <LocaleProvider locale="ar-EG">
        <Field label="وقت الوصول">
          <TimeInput defaultValue="14:30" />
        </Field>
      </LocaleProvider>
      <LocaleProvider locale="fr-FR">
        <Field label="Heure d’arrivée">
          <TimeInput defaultValue="14:30" />
        </Field>
      </LocaleProvider>
    </div>
  )
}

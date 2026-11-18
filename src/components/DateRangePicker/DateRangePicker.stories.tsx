import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { DateRangePicker, type DateRangeValue } from './DateRangePicker.js'
import { Field } from '../Field/Field.js'
import { Button } from '../Button/Button.js'
import { LocaleProvider } from '../LocaleProvider/LocaleProvider.js'

const meta = {
  title: 'Components/DateRangePicker',
  component: DateRangePicker,
  args: { startLabel: 'Start date', endLabel: 'End date' }
} satisfies Meta<typeof DateRangePicker>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const WithField: Story = {
  render: args => (
    <Field
      layout="group"
      label="Travel dates"
      description="Enter both dates or choose them on the calendar."
      required
    >
      <DateRangePicker {...args} />
    </Field>
  )
}
export const SharedControlSizes: Story = {
  render: args => (
    <div className="grid gap-4">
      {(['small', 'medium', 'large'] as const).map(size => (
        <Field
          layout="group"
          key={size}
          label={size}
        >
          <DateRangePicker
            {...args}
            controlSize={size}
          />
        </Field>
      ))}
    </div>
  )
}

function Reservation() {
  const [value, setValue] = useState<DateRangeValue>({ start: null, end: null })
  const [receipt, setReceipt] = useState('')
  return (
    <form
      className="grid gap-3"
      onSubmit={event => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        setReceipt(data.get('arrival') + ' – ' + data.get('departure'))
      }}
    >
      <DateRangePicker
        startLabel="Arrival"
        endLabel="Departure"
        startName="arrival"
        endName="departure"
        required
        value={value}
        onValueChange={setValue}
      />
      <Button type="submit">Confirm dates</Button>
      <output aria-live="polite">{receipt}</output>
    </form>
  )
}
export const Controlled: Story = { render: () => <Reservation /> }
export const PresetRanges: Story = {
  args: {
    today: '2028-03-01',
    presets: [
      { label: 'Opening weekend', start: '2028-03-03', end: '2028-03-05' },
      { label: 'Festival week', start: '2028-03-06', end: '2028-03-12' }
    ]
  }
}
export const LocalizedDates: Story = {
  render: () => (
    <LocaleProvider locale="fr-FR">
      <DateRangePicker
        startLabel="Arrivée"
        endLabel="Départ"
        calendarLabel="Choisir les dates"
        defaultValue={{ start: '2028-02-29', end: '2028-03-05' }}
      />
    </LocaleProvider>
  )
}

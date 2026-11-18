import { useId, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  DateRangePicker,
  type DateRangePickerProps,
  type DateRangeValue
} from './DateRangePicker.js'
import { Field } from '../Field/Field.js'
import { Button } from '../Button/Button.js'

const meta = {
  title: 'Components/DateRangePicker',
  component: DateRangePicker,
  args: { startLabel: 'Start date', endLabel: 'End date' },
  parameters: {
    docs: {
      description: {
        component:
          'Enter either date first or choose both in the calendar. Calendar picks put the earlier day first. Dates in `value`, `defaultValue`, and `presets` are ISO civil dates. `startName` and `endName` submit the endpoints separately. The root uses `data-slot="date-range-picker"`, with `date-range-start` and `date-range-end` on the editors.'
      }
    }
  },
  argTypes: {
    startLabel: { control: 'text' },
    endLabel: { control: 'text' },
    startName: { control: 'text' },
    endName: { control: 'text' },
    calendarLabel: { control: 'text' },
    previousMonthLabel: { control: 'text' },
    nextMonthLabel: { control: 'text' },
    value: { control: 'object', description: 'Parent-owned ISO dates. Use with onValueChange.' },
    defaultValue: {
      control: 'object',
      description: 'Initial ISO dates for an uncontrolled range.'
    },
    onValueChange: { control: false },
    presets: { control: 'object' },
    form: { control: 'text' },
    min: { control: 'text' },
    max: { control: 'text' },
    today: { control: 'text' },
    defaultFocusedDate: {
      control: 'text',
      description: 'ISO date to focus when the range is empty.'
    },
    isDateDisabled: { control: false },
    locale: { control: 'text' },
    calendar: { control: 'select', options: ['gregory', 'buddhist'] },
    firstDayOfWeek: { control: 'select', options: [1, 2, 3, 4, 5, 6, 7] },
    controlSize: { control: 'select', options: ['small', 'medium', 'large'] },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    'aria-describedby': { control: 'text' },
    'aria-invalid': { control: 'boolean' },
    className: { control: 'text' }
  }
} satisfies Meta<typeof DateRangePicker>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
function RequestTimeOff({ 'aria-invalid': invalid, ...args }: DateRangePickerProps) {
  const policyId = useId()
  return (
    <Field
      layout="group"
      label="Time off"
      description="Enter the first and last day you’ll be out."
      error={invalid && invalid !== 'false' ? 'These dates overlap a pending request.' : undefined}
      required
    >
      <DateRangePicker
        {...args}
        aria-describedby={policyId}
      />
      <p id={policyId}>Your manager reviews the dates before approving the request.</p>
    </Field>
  )
}
export const WithField: Story = { render: args => <RequestTimeOff {...args} /> }
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
        today="2028-02-29"
        defaultFocusedDate="2028-04-01"
        min="2028-03-01"
        max="2028-05-31"
        previousMonthLabel="Previous booking month"
        nextMonthLabel="Next booking month"
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
    min: '2028-03-01',
    max: '2028-03-31',
    startLabel: 'Festival starts',
    endLabel: 'Festival ends',
    isDateDisabled: date => date === '2028-03-08',
    presets: [
      { label: 'Opening weekend', start: '2028-03-03', end: '2028-03-05' },
      { label: 'Festival week', start: '2028-03-06', end: '2028-03-12' },
      { label: 'Closing weekend', start: '2028-03-10', end: '2028-03-12' }
    ]
  }
}
export const LocalizedDates: Story = {
  args: {
    startLabel: 'วันเริ่มโครงการ',
    endLabel: 'วันสิ้นสุดโครงการ',
    calendarLabel: 'เลือกช่วงวันที่',
    previousMonthLabel: 'เดือนก่อนหน้า',
    nextMonthLabel: 'เดือนถัดไป',
    locale: 'th-TH-u-nu-thai',
    calendar: 'buddhist',
    firstDayOfWeek: 1,
    today: '2028-02-29',
    defaultValue: { start: '2028-02-29', end: '2028-03-05' }
  }
}

function EditReportPeriod(args: DateRangePickerProps) {
  const form = useId()
  const [receipt, setReceipt] = useState('')
  return (
    <div className="grid gap-3">
      <DateRangePicker
        {...args}
        form={form}
        startName="from"
        endName="through"
      />
      <form
        id={form}
        className="flex flex-wrap gap-2"
        onSubmit={event => {
          event.preventDefault()
          const data = new FormData(event.currentTarget)
          setReceipt(
            data.has('from') ? `${data.get('from')} – ${data.get('through')}` : 'Dates skipped'
          )
        }}
        onReset={() => setReceipt('')}
      >
        <Button type="submit">Run report</Button>
        <Button
          type="reset"
          variant="outline"
        >
          Restore dates
        </Button>
      </form>
      <output aria-live="polite">{receipt}</output>
    </div>
  )
}
export const EditSavedReport: Story = {
  args: {
    startLabel: 'Report from',
    endLabel: 'Report through',
    defaultValue: { start: '2028-04-01', end: '2028-04-30' }
  },
  render: args => <EditReportPeriod {...args} />
}

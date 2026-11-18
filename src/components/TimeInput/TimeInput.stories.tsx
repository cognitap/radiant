import { useId, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { TimeInput, type TimeInputProps } from './TimeInput.js'
import { Field } from '../Field/Field.js'
import { DatePicker } from '../DatePicker/DatePicker.js'
import { Button } from '../Button/Button.js'
import { LocaleProvider } from '../LocaleProvider/LocaleProvider.js'

const meta = {
  title: 'Components/TimeInput',
  component: TimeInput,
  args: { 'aria-label': 'Start time' },
  parameters: {
    docs: {
      description: {
        component:
          'Enter a local time as hours and minutes, with optional seconds. Display follows the locale or the explicit `hourCycle`. A named `Field`, `aria-label`, or `aria-labelledby` labels the group. The hour input receives `ref` and `id`. Native forms submit a single ISO time through `name`, including when `form` points to a separate form. Use `className` and `style` on the `time-input` wrapper. The `time-input-period` button uses `--rad-time-input-period-color` and `--rad-time-input-period-indicator-color`.'
      }
    }
  },
  argTypes: {
    className: { control: 'text' },
    style: { control: 'object' },
    locale: { control: 'text' },
    hourCycle: { control: 'select', options: ['h11', 'h12', 'h23', 'h24'] },
    controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] },
    required: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    disabled: { control: 'boolean' },
    'aria-invalid': { control: 'boolean' },
    showSeconds: { control: 'boolean' },
    min: { control: 'text' },
    max: { control: 'text' },
    step: { control: { type: 'number', min: 1, step: 1 } }
  }
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

function Appointment({ style }: Pick<TimeInputProps, 'style'>) {
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
          hourCycle="h12"
          min="09:00"
          max="22:00"
          step={900}
          value={value}
          onValueChange={setValue}
          style={style}
        />
      </Field>
      <Button type="submit">Confirm appointment</Button>
      <output aria-live="polite">{receipt}</output>
    </form>
  )
}

export const Controlled: Story = {
  args: { style: { '--rad-time-input-period-indicator-color': 'var(--rad-color-accent)' } },
  render: ({ style }) => <Appointment style={style} />
}

export const WithSeconds: Story = {
  render: () => (
    <Field
      label="Overnight capture start"
      description="Choose a start time from 23:45 to 00:30, in 15-second intervals."
    >
      <TimeInput
        defaultValue="23:59"
        hourCycle="h23"
        showSeconds
        min="23:45"
        max="00:30"
        step={15}
      />
    </Field>
  )
}

export const LocalizedTimes: Story = {
  render: () => (
    <div className="grid gap-3">
      <LocaleProvider locale="ar-EG">
        <Field label="وقت الوصول">
          <TimeInput defaultValue="14:30" />
        </Field>
      </LocaleProvider>
      <Field label={<span lang="fr">Heure d’arrivée</span>}>
        <TimeInput
          locale="fr-FR"
          defaultValue="14:30"
        />
      </Field>
    </div>
  )
}

function ReviewShift() {
  const form = useId()
  const label = useId()
  const help = useId()
  const [included, setIncluded] = useState(true)
  const [receipt, setReceipt] = useState('')
  return (
    <div className="grid gap-3">
      <div className="grid gap-1">
        <span id={label}>Scheduled shift start</span>
        <TimeInput
          aria-labelledby={label}
          aria-describedby={help}
          defaultValue="08:00"
          form={form}
          name="start"
          readOnly
          disabled={!included}
        />
        <p id={help}>The scheduled start is set by the shift planner.</p>
      </div>
      <form
        id={form}
        className="grid justify-items-start gap-3"
        onSubmit={event => {
          event.preventDefault()
          const start = new FormData(event.currentTarget).get('start')
          setReceipt(
            start ? `Recorded shift start at ${start}.` : 'Recorded without a shift start.'
          )
        }}
      >
        <Button
          variant="outline"
          pressed={included}
          onPressedChange={setIncluded}
        >
          Include shift start
        </Button>
        <Button type="submit">Record shift</Button>
        <output aria-live="polite">{receipt}</output>
      </form>
    </div>
  )
}

export const ReviewShiftSchedule: Story = { render: () => <ReviewShift /> }

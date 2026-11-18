import { useId, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Calendar, type CalendarRange } from './Calendar.js'
import { Button } from '../Button/Button.js'
import { LocaleProvider } from '../LocaleProvider/LocaleProvider.js'

const meta = {
  title: 'Components/Calendar',
  component: Calendar,
  args: { 'aria-label': 'Choose a date' },
  parameters: {
    docs: {
      description: {
        component:
          'Choose one ISO date or a start and end date with `type="range"`. Use `defaultValue` for an initial selection, or `value` and `onValueChange` to own it. `defaultFocusedDate` opens the grid on a day independently of `today` and the selection.'
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
} satisfies Meta<typeof Calendar>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

function BookAppointment() {
  const labelId = useId()
  const [date, setDate] = useState<string | null>(null)
  return (
    <div className="grid gap-2">
      <h2 id={labelId}>Book an appointment</h2>
      <Calendar
        aria-labelledby={labelId}
        today="2026-11-18"
        defaultFocusedDate="2026-12-02"
        min="2026-11-18"
        max="2026-12-18"
        isDateDisabled={day => [0, 6].includes(new Date(day).getUTCDay())}
        previousMonthLabel="Previous booking month"
        nextMonthLabel="Next booking month"
        value={date}
        onValueChange={setDate}
      />
      <output aria-live="polite">{date ?? 'Choose an available weekday.'}</output>
    </div>
  )
}

export const BookingWindow: Story = { render: () => <BookAppointment /> }

function StayDates() {
  const [stay, setStay] = useState<CalendarRange | null>(null)
  return (
    <div className="grid justify-items-start gap-2">
      <Calendar
        type="range"
        aria-label="Stay dates"
        today="2026-11-18"
        value={stay}
        onValueChange={setStay}
      />
      <output aria-live="polite">
        {stay?.end
          ? stay.start + ' – ' + stay.end
          : stay
            ? 'Choose an end date for ' + stay.start
            : 'Choose a start date'}
      </output>
      <Button
        variant="outline"
        disabled={!stay}
        onClick={() => setStay(null)}
      >
        Clear stay dates
      </Button>
    </div>
  )
}

export const ChooseARange: Story = { render: () => <StayDates /> }

export const RescheduleAVisit: Story = {
  args: {
    'aria-label': 'Reschedule visit',
    defaultValue: '2026-11-24',
    today: '2026-11-18',
    firstDayOfWeek: 1,
    controlSize: 'small'
  }
}

export const BuddhistCalendar: Story = {
  args: {
    'aria-label': 'เลือกวันที่',
    today: '2026-11-18',
    locale: 'th-TH-u-nu-thai',
    calendar: 'buddhist'
  }
}

export const RightToLeft: Story = {
  decorators: [
    Story => (
      <LocaleProvider locale="ar-EG">
        <Story />
      </LocaleProvider>
    )
  ],
  args: { 'aria-label': 'اختر التاريخ', today: '2026-11-18' }
}

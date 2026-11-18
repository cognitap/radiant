import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Calendar, type CalendarRange } from './Calendar.js'
import { LocaleProvider } from '../LocaleProvider/LocaleProvider.js'

const meta = {
  title: 'Components/Calendar',
  component: Calendar,
  args: {
    'aria-label': 'Choose a date',
    previousMonthLabel: 'Previous month',
    nextMonthLabel: 'Next month'
  }
} satisfies Meta<typeof Calendar>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

function StayDates() {
  const [stay, setStay] = useState<CalendarRange | null>({ start: '2026-11-18', end: '2026-11-22' })
  return (
    <div className="grid gap-2">
      <Calendar
        type="range"
        aria-label="Stay dates"
        today="2026-11-18"
        value={stay}
        onValueChange={setStay}
        previousMonthLabel="Previous month"
        nextMonthLabel="Next month"
      />
      <output aria-live="polite">
        {stay?.end
          ? stay.start + ' – ' + stay.end
          : stay
            ? 'Choose an end date for ' + stay.start
            : 'Choose a start date'}
      </output>
    </div>
  )
}

export const ChooseARange: Story = { render: () => <StayDates /> }

export const BookingWindow: Story = {
  args: {
    today: '2026-11-18',
    min: '2026-11-12',
    max: '2026-12-10',
    isDateDisabled: date => [0, 6].includes(new Date(date).getUTCDay())
  }
}

export const BuddhistCalendar: Story = {
  render: () => (
    <LocaleProvider locale="th-TH-u-nu-thai">
      <Calendar
        aria-label="เลือกวันที่"
        today="2026-11-18"
      />
    </LocaleProvider>
  )
}

export const RightToLeft: Story = {
  render: () => (
    <LocaleProvider locale="ar-EG">
      <Calendar
        aria-label="اختر التاريخ"
        today="2026-11-18"
      />
    </LocaleProvider>
  )
}

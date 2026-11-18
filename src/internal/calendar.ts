import { supportedLocale } from './locale.js'

export type CalendarSystem = 'gregory' | 'buddhist'
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7

// CLDR supplemental/weekData firstDay, shared by server and browser.
// https://github.com/unicode-org/cldr-json/blob/main/cldr-json/cldr-core/supplemental/weekData.json
const sunday = new Set(
  'AG AS BD BR BS BT BW BZ CA CO DM DO ET GT GU HK HN ID IL IN IS JM JP KE KH KR LA MH MM MO MT MX MZ NI NP PA PE PH PK PR PT PY SA SG SV TH TT TW UM US VE VI WS YE ZA ZW'.split(
    ' '
  )
)
const saturday = new Set('AF BH DJ DZ EG IQ IR JO KW LY OM QA SD SY'.split(' '))
const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

function regionalWeekStart(locale: string) {
  const tag = new Intl.Locale(locale)
  const extension =
    tag
      .toString()
      .split('-u-')[1]
      ?.split(/-[a-z0-9]-/)[0] ?? ''
  const preferred = weekdays.indexOf(extension.match(/(?:^|-)fw-([a-z]{3})(?:-|$)/)?.[1] ?? '')
  if (preferred >= 0) return preferred + 1
  const region =
    extension.match(/(?:^|-)rg-([a-z]{2}|\d{3})zzzz(?:-|$)/)?.[1]?.toUpperCase() ??
    tag.maximize().region ??
    '001'
  if (sunday.has(region)) return 7
  if (saturday.has(region)) return 6
  return region === 'MV' ? 5 : 1
}

export function calendarFormat(requested: string, calendar?: CalendarSystem) {
  const locale = supportedLocale(Intl.DateTimeFormat, requested)
  const preferred = new Intl.DateTimeFormat(locale).resolvedOptions().calendar
  const options = {
    calendar: calendar ?? (preferred === 'buddhist' ? 'buddhist' : 'gregory'),
    timeZone: 'UTC'
  }
  return (fields: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { ...options, ...fields })
}

export function calendarLabels(requested: string, calendar?: CalendarSystem) {
  const locale = supportedLocale(Intl.DateTimeFormat, requested)
  const dateFormat = calendarFormat(locale, calendar)
  return {
    weekStart: regionalWeekStart(locale),
    month: dateFormat({ month: 'long', year: 'numeric' }),
    date: dateFormat({ dateStyle: 'full' }),
    weekday: dateFormat({ weekday: 'short' }),
    weekdayName: dateFormat({ weekday: 'long' }),
    day: new Intl.NumberFormat(locale, { useGrouping: false })
  }
}

export const dayMs = 86_400_000
export function isoDate(time: number) {
  return new Date(time).toISOString().slice(0, 10)
}

export function civilTime(iso: string) {
  const time = Date.parse(iso + 'T00:00:00Z')
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(iso) ||
    iso.startsWith('0000') ||
    !Number.isFinite(time) ||
    isoDate(time) !== iso
  )
    throw new RangeError(
      'Calendar dates must be valid ISO dates from 0001-01-01 through 9999-12-31.'
    )
  return time
}

export function monthStart(time: number, offset = 0) {
  const date = new Date(time)
  return date.setUTCMonth(date.getUTCMonth() + offset, 1)
}

export function shiftMonth(time: number, offset: number) {
  const start = monthStart(time, offset)
  const sameDay = start + (new Date(time).getUTCDate() - 1) * dayMs
  return Math.min(sameDay, monthStart(start, 1) - dayMs)
}

export function rangeHasDisabledDate(
  start: string,
  end: string,
  isDateDisabled?: (iso: string) => boolean
) {
  if (!isDateDisabled) return false
  const last = civilTime(end)
  for (let day = civilTime(start); day <= last; day += dayMs) {
    if (isDateDisabled(isoDate(day))) return true
  }
  return false
}

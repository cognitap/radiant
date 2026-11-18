import { calendarFormat, civilTime, isoDate, type CalendarSystem } from '../../internal/calendar.js'

export type Segment = 'day' | 'month' | 'year'
export type Segments = Record<Segment, string>

const empty: Segments = { day: '', month: '', year: '' }

export function dateSegments(locale: string, calendar?: CalendarSystem) {
  const format = calendarFormat(
    locale,
    calendar
  )({ year: 'numeric', month: '2-digit', day: '2-digit' })
  const resolved = format.resolvedOptions()
  const numbers = new Intl.NumberFormat(resolved.locale, {
    numberingSystem: resolved.numberingSystem,
    useGrouping: false
  })
  const digits = Array.from({ length: 10 }, (_, i) => numbers.format(i))
  const names = new Intl.DisplayNames(resolved.locale, { type: 'dateTimeField' })
  const parts = format.formatToParts(Date.UTC(2000, 10, 22))
  const yearOffset = resolved.calendar === 'buddhist' ? 543 : 0
  function ascii(text: string) {
    return Array.from(text, char =>
      digits.includes(char) ? String(digits.indexOf(char)) : char
    ).join('')
  }
  const localize = (text: string) => text.replace(/[0-9]/g, digit => digits[Number(digit)])
  return {
    parts,
    names,
    ascii,
    localize,
    maxYearDigits: String(9999 + yearOffset).length,
    display(iso: string | null): Segments {
      if (!iso) return empty
      civilTime(iso)
      const [year, month, day] = iso.split('-')
      return { year: String(Number(year) + yearOffset).padStart(4, '0'), month, day }
    },
    parse(parts: Segments): string | null | undefined {
      const { year, month, day } = parts
      if (!year && !month && !day) return null
      if (year.length < 4 || !month || !day) return undefined
      const isoYear = Number(year) - yearOffset
      if (isoYear < 1 || isoYear > 9999) return undefined
      const iso = [
        String(isoYear).padStart(4, '0'),
        month.padStart(2, '0'),
        day.padStart(2, '0')
      ].join('-')
      const time = Date.parse(iso + 'T00:00:00Z')
      return Number.isFinite(time) && isoDate(time) === iso ? iso : undefined
    }
  }
}

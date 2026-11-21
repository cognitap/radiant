/**
 * ISO 8601 handling for the A2UI `DateTimeInput`. A value with `Z` or an offset names an instant:
 * it shows in local wall time and edits write it back in UTC with `Z`, keeping its seconds.
 * A value without one is floating: it shows as written and edits write `YYYY-MM-DD`, `HH:mm`,
 * or `YYYY-MM-DDTHH:mm`.
 */
export type DateTimeInputType = 'date' | 'time' | 'datetime-local'

type ParsedDateTime = {
  /** `YYYY-MM-DD` in the wall time the input shows. */
  readonly date?: string
  /** `HH:mm` in the wall time the input shows. */
  readonly time?: string
  /** Seconds of the time, kept when an edit rewrites an instant. */
  readonly seconds: number
  /** True when the value carried `Z` or an offset. */
  readonly zoned: boolean
}

const ISO_PATTERN =
  /^(?:(\d{4}-\d{2}-\d{2}))?(?:(?:^|[T ])(\d{2}:\d{2})(?::(\d{2})(?:\.\d+)?)?)?(Z|[+-]\d{2}:?\d{2})?$/i

const pad = (n: number) => String(n).padStart(2, '0')
const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const localTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

/** Reads an ISO 8601 date, time, or date-time; a `T` or a space may separate date and time. */
export function parseDateTime(value: string): ParsedDateTime | undefined {
  const match = ISO_PATTERN.exec(value.trim())
  if (!match || (!match[1] && !match[2])) return undefined
  const [, date, time, seconds, zone] = match
  const secs = seconds ? Number(seconds) : 0
  if (!zone || !date || !time) return { date, time, seconds: secs, zoned: false }
  const instant = new Date(`${date}T${time}:${pad(secs)}${zone.toUpperCase()}`)
  if (Number.isNaN(instant.getTime())) return undefined
  return { date: localDate(instant), time: localTime(instant), seconds: secs, zoned: true }
}

/** The value the native input of `type` shows for an ISO 8601 value, or `''`. */
export function toNativeDateTime(value: string, type: DateTimeInputType): string {
  const parsed = parseDateTime(value)
  if (!parsed) return ''
  if (type === 'date') return parsed.date ?? ''
  if (type === 'time') return parsed.time ?? ''
  return parsed.date && parsed.time ? `${parsed.date}T${parsed.time}` : ''
}

/**
 * The native `min` or `max` for an ISO 8601 bound. A date-only bound on a date-time input covers
 * the whole day; a bound with a date never limits a time-only input.
 */
export function toNativeBound(
  value: string,
  type: DateTimeInputType,
  edge: 'min' | 'max'
): string | undefined {
  const parsed = parseDateTime(value)
  if (!parsed) return undefined
  if (type === 'date') return parsed.date
  if (type === 'time') return parsed.date ? undefined : parsed.time
  if (!parsed.date) return undefined
  return `${parsed.date}T${parsed.time ?? (edge === 'min' ? '00:00' : '23:59')}`
}

/** The ISO 8601 value to write after the native input of `type` changed to `next`. */
export function fromNativeDateTime(
  next: string,
  type: DateTimeInputType,
  previous: string
): string {
  if (!next) return ''
  const before = parseDateTime(previous)
  if (!before?.zoned) return next
  const [date, time] =
    type === 'date'
      ? [next, before.time!]
      : type === 'time'
        ? [before.date!, next]
        : (next.split('T') as [string, string])
  const [year, month, day] = date.split('-').map(Number) as [number, number, number]
  const [hours, minutes] = time.split(':').map(Number) as [number, number]
  const instant = new Date(year, month - 1, day, hours, minutes, before.seconds)
  return `${instant.toISOString().slice(0, 19)}Z`
}

import { supportedLocale } from '../../internal/locale.js'

type Parts = { hours: number; minutes: number; seconds: number }
type Formatters = {
  plain: Intl.NumberFormat
  padded: Intl.NumberFormat
  units: Record<'hour' | 'minute' | 'second', Intl.NumberFormat>
  list: Intl.ListFormat
}

const cache = new Map<string, Formatters>()

/** Formatters for one locale, built once, since time updates format several times a second. */
function formatters(locale: string): Formatters {
  let found = cache.get(locale)
  if (found) return found
  const resolved = supportedLocale(Intl.NumberFormat, locale)
  const unit = (name: 'hour' | 'minute' | 'second') =>
    new Intl.NumberFormat(resolved, { style: 'unit', unit: name, unitDisplay: 'long' })
  found = {
    plain: new Intl.NumberFormat(resolved, { useGrouping: false }),
    padded: new Intl.NumberFormat(resolved, { useGrouping: false, minimumIntegerDigits: 2 }),
    units: { hour: unit('hour'), minute: unit('minute'), second: unit('second') },
    list: new Intl.ListFormat(supportedLocale(Intl.ListFormat, resolved), {
      type: 'unit',
      style: 'long'
    })
  }
  cache.set(locale, found)
  return found
}

const split = (total: number): Parts => {
  const whole = Math.max(0, Math.floor(total))
  return {
    hours: Math.floor(whole / 3600),
    minutes: Math.floor((whole % 3600) / 60),
    seconds: whole % 60
  }
}

/** A media length the player can show: finite and not negative. */
export const isKnownDuration = (duration: number) => Number.isFinite(duration) && duration >= 0

/**
 * Clock text such as `1:05` or `1:02:05` in the locale's digits. `withHours` keeps the hour
 * field so elapsed and total times line up when the total reaches an hour.
 */
export function formatClock(seconds: number, locale: string, withHours: boolean): string {
  const { plain, padded } = formatters(locale)
  const { hours, minutes, seconds: rest } = split(seconds)
  return withHours || hours > 0
    ? `${plain.format(hours)}:${padded.format(minutes)}:${padded.format(rest)}`
    : `${plain.format(minutes)}:${padded.format(rest)}`
}

/** Spoken length such as `1 minute, 5 seconds`, from the locale's unit names. */
export function formatSpokenTime(seconds: number, locale: string): string {
  const { units, list } = formatters(locale)
  const { hours, minutes, seconds: rest } = split(seconds)
  const fields = [
    hours ? units.hour.format(hours) : '',
    minutes ? units.minute.format(minutes) : '',
    rest || (!hours && !minutes) ? units.second.format(rest) : ''
  ].filter(Boolean)
  return list.format(fields)
}

import { supportedLocale } from '../../internal/locale.js'
import { localizedDigits } from '../../internal/localizedDigits.js'

export type HourCycle = 'h11' | 'h12' | 'h23' | 'h24'
export type ClockPart = 'hour' | 'minute' | 'second'
export type TimeParts = Record<ClockPart, string> & { dayPeriod: 'am' | 'pm' }

const day = 86400
const pad = (number: number) => String(number).padStart(2, '0')

export function secondsOf(iso: string) {
  if (!/^(?:[01][0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?$/.test(iso))
    throw new RangeError('TimeInput expects an ISO wall-clock time in HH:mm or HH:mm:ss format.')
  const [h, m, s = 0] = iso.split(':').map(Number)
  return h * 3600 + m * 60 + s
}

export function isoTime(seconds: number, withSeconds: boolean) {
  const hm = pad(Math.floor(seconds / 3600)) + ':' + pad(Math.floor(seconds / 60) % 60)
  return withSeconds ? hm + ':' + pad(seconds % 60) : hm
}

export function timeRange(min: string | undefined, max: string | undefined, step: number) {
  if (!Number.isSafeInteger(step) || step < 1)
    throw new RangeError('TimeInput step must be a positive whole number of seconds.')
  const lower = min === undefined ? 0 : secondsOf(min)
  const end = max === undefined ? day - 1 : secondsOf(max)
  const overnight = end < lower
  const upper = overnight ? end + day : end
  const last = Math.floor((upper - lower) / step)
  const position = (n: number) => (overnight && n < lower ? n + day : n)
  return {
    allows(n: number) {
      const t = position(n)
      return t >= lower && t <= upper && (t - lower) % step === 0
    },
    move(n: number | null, delta: number) {
      if (n === null && min !== undefined) return lower
      const index = (position(n ?? 0) + delta - lower) / step
      let next = delta > 0 ? Math.ceil(index) : Math.floor(index)
      if (min === undefined && max === undefined) {
        const count = last + 1
        next = ((next % count) + count) % count
      } else next = Math.max(0, Math.min(last, next))
      return (lower + next * step) % day
    }
  }
}

export function timeSegments(
  requested: string,
  hourCycle: HourCycle | undefined,
  withSeconds: boolean
) {
  const locale = supportedLocale(Intl.DateTimeFormat, requested)
  const format = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: withSeconds ? '2-digit' : undefined,
    hourCycle,
    timeZone: 'UTC'
  })
  const resolved = format.resolvedOptions()
  const cycle = resolved.hourCycle
  const halfDay = cycle === 'h11' || cycle === 'h12'
  const hourMin = cycle === 'h12' || cycle === 'h24' ? 1 : 0
  const hourMax = hourMin + (halfDay ? 11 : 23)
  const parts = format.formatToParts(0)
  const dayPeriodAt = (h: number) =>
    format.formatToParts(h * 3600000).find(part => part.type === 'dayPeriod')?.value
  const names = new Intl.DisplayNames(resolved.locale, { type: 'dateTimeField' })
  return {
    parts,
    names,
    hourMin,
    hourMax,
    am: dayPeriodAt(0),
    pm: dayPeriodAt(12),
    ...localizedDigits(resolved.locale, resolved.numberingSystem),
    display(n: number | null): TimeParts {
      if (n === null) return { hour: '', minute: '', second: '', dayPeriod: 'am' }
      const h = Math.floor(n / 3600)
      const hour = (halfDay ? h % 12 : h) || (hourMin === 1 ? hourMax : 0)
      return {
        hour: pad(hour),
        minute: pad(Math.floor(n / 60) % 60),
        second: pad(n % 60),
        dayPeriod: h < 12 ? 'am' : 'pm'
      }
    },
    parse(parts: TimeParts): number | null | undefined {
      if (!parts.hour && !parts.minute && (!withSeconds || !parts.second)) return null
      if (!parts.hour || !parts.minute || (withSeconds && !parts.second)) return undefined
      const h = Number(parts.hour),
        m = Number(parts.minute),
        s = withSeconds ? Number(parts.second) : 0
      if (h < hourMin || h > hourMax || m > 59 || s > 59) return undefined
      const hour = halfDay ? (h % 12) + (parts.dayPeriod === 'pm' ? 12 : 0) : h % 24
      return hour * 3600 + m * 60 + s
    }
  }
}

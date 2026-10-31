import { addDecimal } from './decimal.js'

/** A bounded editable decimal adapter; Intl supplies display and locale symbols. */
export type NumberFieldFormatOptions = {
  style?: 'decimal' | 'percent' | 'currency'
  currency?: string
  currencyDisplay?: 'symbol' | 'narrowSymbol' | 'code'
  currencySign?: 'standard' | 'accounting'
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  useGrouping?: boolean
  signDisplay?: 'auto' | 'always' | 'exceptZero'
}
const clean = (text: string) =>
  text.replace(/[\u061c\u200e\u200f]/g, '').replace(/[\u00a0\u202f]/g, ' ')
const numeric = new Set(['integer', 'group', 'decimal', 'fraction'])
export function createNumberAdapter(locale: string, options: NumberFieldFormatOptions = {}) {
  const allowed = new Set([
    'style',
    'currency',
    'currencyDisplay',
    'currencySign',
    'minimumFractionDigits',
    'maximumFractionDigits',
    'useGrouping',
    'signDisplay'
  ])
  if (
    Object.keys(options).some(key => !allowed.has(key)) ||
    (options.style !== undefined && !['decimal', 'percent', 'currency'].includes(options.style)) ||
    (options.currencyDisplay !== undefined &&
      !['symbol', 'narrowSymbol', 'code'].includes(options.currencyDisplay)) ||
    (options.signDisplay !== undefined &&
      !['auto', 'always', 'exceptZero'].includes(options.signDisplay))
  )
    throw new TypeError('NumberField supports standard decimal, percent and currency formatting.')
  const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 20, ...options })
  const resolved = formatter.resolvedOptions()
  const decimal = new Intl.NumberFormat(locale, {
    numberingSystem: resolved.numberingSystem,
    maximumFractionDigits: 20
  })
  const digits = new Map<string, string>()
  const digitFormatter = new Intl.NumberFormat(locale, {
    numberingSystem: resolved.numberingSystem,
    useGrouping: false
  })
  for (let index = 0; index < 10; index++) digits.set(digitFormatter.format(index), String(index))
  const ascii = (text: string) =>
    Array.from(clean(text), digit => digits.get(digit) ?? digit).join('')
  const samples = decimal.formatToParts(123456789012345.6)
  const group = clean(samples.find(part => part.type === 'group')?.value ?? ',')
  const separator = clean(samples.find(part => part.type === 'decimal')?.value ?? '.')
  const groups = samples
    .filter(part => part.type === 'integer')
    .map(part => ascii(part.value).length)
  const primary = groups.at(-1) ?? 3,
    secondary = groups.at(-2) ?? primary
  const affixes = [1, -1, 0].map(value => {
    const parts = formatter.formatToParts(value)
    const first = parts.findIndex(part => numeric.has(part.type))
    const last = parts.length - 1 - [...parts].reverse().findIndex(part => numeric.has(part.type))
    return {
      prefix: clean(
        parts
          .slice(0, first)
          .map(part => part.value)
          .join('')
      ),
      suffix: clean(
        parts
          .slice(last + 1)
          .map(part => part.value)
          .join('')
      ),
      sign: value < 0 ? -1 : 1
    }
  })
  const plus = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 20,
    ...options,
    signDisplay: 'always'
  }).formatToParts(1)
  affixes.push({
    prefix: clean(
      plus
        .slice(
          0,
          plus.findIndex(part => numeric.has(part.type))
        )
        .map(part => part.value)
        .join('')
    ),
    suffix: clean(
      plus
        .slice(plus.length - 1 - [...plus].reverse().findIndex(part => numeric.has(part.type)) + 1)
        .map(part => part.value)
        .join('')
    ),
    sign: 1
  })
  const minus = clean(
    decimal.formatToParts(-1).find(part => part.type === 'minusSign')?.value ?? '-'
  )
  function bodyNumber(body: string): number | undefined {
    body = ascii(body)
    const split = body.split(separator)
    if (split.length > 2) return
    const whole = split[0]!,
      fraction = split[1]
    if (fraction !== undefined && !/^\d*$/.test(fraction)) return
    const pieces = whole.split(group)
    if (
      pieces.some(piece => !/^\d+$/.test(piece)) &&
      !(whole === '' && fraction && /^\d+$/.test(fraction))
    )
      return
    if (
      pieces.length > 1 &&
      (pieces[0]!.length < 1 ||
        pieces[0]!.length > secondary ||
        pieces.at(-1)!.length !== primary ||
        pieces.slice(1, -1).some(piece => piece.length !== secondary))
    )
      return
    // Shift the decimal before conversion, avoiding percentage division tails or intermediate overflow.
    const value = Number(
      pieces.join('') +
        (fraction === undefined ? '' : '.' + fraction) +
        (resolved.style === 'percent' ? 'e-2' : '')
    )
    return Number.isFinite(value) ? value : undefined
  }
  return {
    key: JSON.stringify(resolved),
    format: (value: number | null) => (value === null ? '' : formatter.format(value)),
    parse(text: string): number | null | undefined {
      text = clean(text).trim()
      if (text === '') return null
      const candidates: { body: string; sign: number }[] = []
      for (const { prefix, suffix, sign } of affixes)
        if (
          text.startsWith(prefix) &&
          text.endsWith(suffix) &&
          text.length > prefix.length + suffix.length
        )
          candidates.push({
            body: text.slice(prefix.length, suffix.length ? -suffix.length : undefined),
            sign
          })
      const negative = text.startsWith(minus) || text.startsWith('-')
      const signed = negative || text.startsWith('+')
      candidates.push({
        body: signed
          ? text.slice((negative && text.startsWith(minus) ? minus : text[0]!).length)
          : text,
        sign: negative ? -1 : 1
      })
      for (const { body, sign } of candidates) {
        const parsed = bodyNumber(body)
        if (parsed !== undefined) {
          const value = sign * parsed
          if (Number.isFinite(value)) return value === 0 ? 0 : value
        }
      }
      return undefined
    }
  }
}
export function requireFiniteNumber(name: string, value: unknown, nullable = false) {
  if (nullable && value === null) return
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new TypeError(name + ' must be finite.')
}
export const clampNumber = (value: number, min?: number, max?: number) =>
  Math.min(max ?? Infinity, Math.max(min ?? -Infinity, value))
/** Add a decimal step, respecting the public finite-number range. */
export function addNumberStep(value: number, amount: number, min?: number, max?: number) {
  const next = clampNumber(addDecimal(value, amount), min, max)
  return Number.isFinite(next) ? next : value
}

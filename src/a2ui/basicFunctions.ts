import {
  Catalog,
  createFunctionImplementation,
  type FunctionApi,
  type FunctionImplementation
} from '@a2ui/web_core/catalog'
import { A2uiExpressionError } from '@a2ui/web_core/errors'
import { isSafeRegex } from '@a2ui/web_core'
import { ExpressionParser } from '@a2ui/web_core/expressions'
import { computed, getValue, isSignal } from '@a2ui/web_core/reactivity'
import type { DataContext } from '@a2ui/web_core/resolution'
import { A2UI_BASIC_FUNCTION_SCHEMAS } from './basicFunctionSchemas.js'

type A2uiJsonSchema = { readonly [keyword: string]: unknown }
type Args = Record<string, unknown>
type Execute = (args: Args, context: DataContext, locale: string) => unknown

/**
 * Basic-catalog functions Radiant does not offer. `openUrl` navigates the window, and Radiant
 * leaves navigation to the host, which can act on a named action instead.
 */
export const A2UI_OMITTED_FUNCTIONS: readonly string[] = ['openUrl']

const result = (valid: boolean, message: string) => (valid ? { valid } : { valid, message })
const num = (v: unknown) => (typeof v === 'number' && !Number.isNaN(v) ? v : undefined)
const truthy = (v: unknown) =>
  v && typeof v === 'object' && !Array.isArray(v) && typeof (v as Args).valid === 'boolean'
    ? (v as Args).valid === true
    : Boolean(v)

function atLeastTwo(values: unknown, name: string): unknown[] {
  if (!Array.isArray(values) || values.length < 2) {
    throw new A2uiExpressionError(`${name} requires at least 2 values`, name)
  }
  return values
}

function stringOf(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value !== 'object') return String(value)
  try {
    return JSON.stringify(value) ?? String(value)
  } catch {
    return String(value)
  }
}

// The expression parser emits interpolations in the pre-1.0 `path`/`call` shape.
function toWireExpression(part: unknown): unknown {
  if (!part || typeof part !== 'object' || Array.isArray(part)) return part
  const record = part as Args
  if (typeof record.path === 'string' && !('@path' in record)) return { '@path': record.path }
  if (typeof record.call === 'string' && !('@call' in record)) {
    const args: Args = {}
    for (const [key, value] of Object.entries((record.args as Args | undefined) ?? {})) {
      args[key] = toWireExpression(value)
    }
    return { '@call': record.call, args, returnType: record.returnType }
  }
  return part
}

const pad = (n: number) => String(n).padStart(2, '0')

function formatDate(value: unknown, pattern: unknown, locale: string): string {
  if (!value) return ''
  const text = String(value)
  const zoned = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(text)
  const instant = new Date(zoned ? text : `${text}Z`)
  if (Number.isNaN(instant.getTime())) return ''
  if (pattern === 'ISO') return instant.toISOString()
  // Shows the wall time the value was written in, not the viewer's.
  const offset = /([+-])(\d{2}):?(\d{2})$/.exec(text)
  const minutes = offset ? (offset[1] === '-' ? -1 : 1) * (+offset[2]! * 60 + +offset[3]!) : 0
  const d = new Date(instant.getTime() + minutes * 60_000)
  const name = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(d)
  const h = d.getUTCHours()
  const tokens: Record<string, () => string> = {
    yyyy: () => String(d.getUTCFullYear()),
    yy: () => String(d.getUTCFullYear()).slice(-2),
    MMMM: () => name({ month: 'long' }),
    MMM: () => name({ month: 'short' }),
    MM: () => pad(d.getUTCMonth() + 1),
    M: () => String(d.getUTCMonth() + 1),
    EEEE: () => name({ weekday: 'long' }),
    E: () => name({ weekday: 'short' }),
    dd: () => pad(d.getUTCDate()),
    d: () => String(d.getUTCDate()),
    HH: () => pad(h),
    H: () => String(h),
    hh: () => pad(h % 12 || 12),
    h: () => String(h % 12 || 12),
    mm: () => pad(d.getUTCMinutes()),
    ss: () => pad(d.getUTCSeconds()),
    a: () => (h < 12 ? 'AM' : 'PM')
  }
  return String(pattern || 'yyyy-MM-dd').replace(
    /yyyy|yy|MMMM|MMM|MM|M|EEEE|E|dd|d|HH|H|hh|h|mm|ss|a/g,
    token => tokens[token]!()
  )
}

function bounded(n: number, min: unknown, max: unknown, noun: string) {
  if (num(min) !== undefined && n < num(min)!) return result(false, `Minimum ${noun} is ${min}.`)
  return result(!(num(max) !== undefined && n > num(max)!), `Maximum ${noun} is ${max}.`)
}

const IMPLEMENTATIONS: Readonly<Record<string, Execute>> = {
  required: ({ value }) =>
    result(
      value !== null &&
        value !== undefined &&
        value !== '' &&
        !(Array.isArray(value) && value.length === 0),
      'This field is required.'
    ),
  regex: ({ value, pattern }) => {
    const source = String(pattern)
    if (!isSafeRegex(source)) throw new A2uiExpressionError(`Unsafe regex: ${source}`, 'regex')
    return result(new RegExp(source).test(String(value ?? '')), 'Value does not match.')
  },
  length: ({ value, min, max }) =>
    bounded(
      typeof value === 'string' || Array.isArray(value) ? value.length : 0,
      min,
      max,
      'length'
    ),
  numeric: ({ value, min, max }) => {
    const n = Number(value)
    return Number.isNaN(n)
      ? result(false, 'Value must be a valid number.')
      : bounded(n, min, max, 'value')
  },
  email: ({ value }) =>
    result(
      typeof value === 'string' && /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value),
      'Enter a valid email address.'
    ),
  and: ({ values }) => atLeastTwo(values, 'and').every(truthy),
  or: ({ values }) => atLeastTwo(values, 'or').some(truthy),
  not: ({ value }) => !truthy(value),
  formatString: ({ value }, context) => {
    const parts = new ExpressionParser()
      .parse(String(value ?? ''))
      .map(part =>
        part && typeof part === 'object'
          ? context.resolveSignal(toWireExpression(part) as never)
          : part
      )
    return computed(() => parts.map(p => stringOf(isSignal(p) ? getValue(p) : p)).join(''))
  },
  formatNumber: ({ value, decimals, grouping }, _context, locale) =>
    num(value) === undefined
      ? ''
      : new Intl.NumberFormat(locale, {
          minimumFractionDigits: num(decimals),
          maximumFractionDigits: num(decimals),
          useGrouping: grouping !== false
        }).format(num(value)!),
  formatCurrency: ({ value, currency, decimals, grouping }, _context, locale) => {
    if (num(value) === undefined) return ''
    const digits = num(decimals) ?? 2
    const code = String(currency).toUpperCase()
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: code,
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
        useGrouping: grouping !== false
      }).format(num(value)!)
    } catch {
      return `${code} ${num(value)!.toFixed(digits)}`
    }
  },
  formatDate: ({ value, format }, _context, locale) => formatDate(value, format, locale),
  pluralize: (args, _context, locale) => {
    const value = num(args.value) ?? 0
    const exact = ({ 0: 'zero', 1: 'one', 2: 'two' } as Record<number, string>)[value]
    const category =
      exact && args[exact] !== undefined ? exact : new Intl.PluralRules(locale).select(value)
    return String(args[category] ?? args.other ?? '')
  }
}

function supportedLocale(locale: string | undefined): string {
  try {
    return locale && Intl.NumberFormat.supportedLocalesOf(locale).length > 0 ? locale : 'en-US'
  } catch {
    return 'en-US'
  }
}

let apis: ReadonlyMap<string, FunctionApi> | undefined

/** The A2UI 1.0 basic-catalog functions Radiant runs, formatting in `locale` (default `en-US`). */
export function createA2uiBasicFunctions(locale?: string): FunctionImplementation[] {
  apis ??= Catalog.fromJson(
    {
      catalogId: 'radiant-basic-functions',
      protocolVersion: '1.0',
      components: {},
      functions: A2UI_BASIC_FUNCTION_SCHEMAS
    },
    '1.0'
  ).functions
  const resolved = supportedLocale(locale)
  return Object.entries(IMPLEMENTATIONS).map(([name, execute]) =>
    createFunctionImplementation(apis!.get(name)! as never, (args, context) =>
      execute(args as Args, context, resolved)
    )
  )
}

/** The `functions` map and `$defs.anyFunction` union for the published catalog document. */
export function a2uiBasicFunctionSchemas(): {
  readonly functions: Record<string, A2uiJsonSchema>
  readonly anyFunction: A2uiJsonSchema
} {
  const functions = structuredClone(A2UI_BASIC_FUNCTION_SCHEMAS) as Record<string, A2uiJsonSchema>
  return {
    functions,
    anyFunction: { oneOf: Object.keys(functions).map(name => ({ $ref: `#/functions/${name}` })) }
  }
}

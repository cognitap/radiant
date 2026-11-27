'use client'

import {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent
} from 'react'
import { cn } from 'cn'
import {
  calendarLabels,
  rangeHasDisabledDate,
  civilTime,
  dayMs,
  isoDate,
  monthStart,
  shiftMonth,
  type CalendarSystem,
  type Weekday
} from '../../internal/calendar.js'
import { requireAccessibleName, type AccessibleName } from '../../internal/accessibleName.js'
import { useControllableState } from '../../react/useControllableState.js'
import { useLocale } from '../../react/useLocale.js'
import type { ValueOwner } from '../../react/useNativeOwner.js'
import type { ControlSize } from '../../presentation.js'
import { Button } from '../Button/Button.js'
import { inlineActionClass } from '../shared/actionStyles.js'
import { StandardIcon } from '../IconProvider/IconProvider.js'

/** ISO civil dates. A null end means the user is choosing the second endpoint. */
export type CalendarRange = { start: string; end: string | null }
type Selection<T> = ValueOwner<T | null> & { onValueChange?: (value: T | null) => void }
export type CalendarProps = Omit<
  ComponentProps<'section'>,
  'children' | 'defaultValue' | 'onChange' | 'role'
> &
  AccessibleName & {
    locale?: string
    calendar?: CalendarSystem
    firstDayOfWeek?: Weekday
    /** Pass the same civil date on the server and client. Defaults to today's UTC date. */
    today?: string
    /** Initial grid tab stop, without selecting a date or moving DOM focus. Defaults to the selection start or today. */
    defaultFocusedDate?: string
    min?: string
    max?: string
    isDateDisabled?: (date: string) => boolean
    controlSize?: ControlSize
    previousMonthLabel?: string
    nextMonthLabel?: string
  } & (({ type?: 'single' } & Selection<string>) | ({ type: 'range' } & Selection<CalendarRange>))

const clamp = (time: number, min: number, max: number) => Math.min(max, Math.max(min, time))

export function Calendar(props: CalendarProps) {
  return (
    <CalendarRoot
      {...props}
      onDaySelect={undefined}
    />
  )
}

/** Composed pickers finish on activation even when the selected date is unchanged. */
export function CalendarRoot(props: CalendarProps & { onDaySelect?: (date: string) => void }) {
  const {
    type,
    value,
    defaultValue,
    onValueChange,
    onDaySelect,
    locale,
    calendar,
    firstDayOfWeek,
    today: suppliedToday,
    defaultFocusedDate,
    min = '0001-01-01',
    max = '9999-12-31',
    isDateDisabled,
    controlSize = 'medium',
    previousMonthLabel,
    nextMonthLabel,
    className,
    ...host
  } = props
  requireAccessibleName('Calendar', host)
  const [initialToday] = useState(() => isoDate(Date.now()))
  const today = suppliedToday ?? initialToday
  const currentLocale = useLocale(locale)
  const labels = useMemo(() => calendarLabels(currentLocale, calendar), [currentLocale, calendar])
  const weekStart = firstDayOfWeek ?? labels.weekStart
  const lower = civilTime(min)
  const upper = civilTime(max)
  if (lower > upper) throw new RangeError('Calendar min must be on or before max.')

  const selection = useControllableState<string | CalendarRange | null>({
    name: 'Calendar value',
    value,
    defaultValue,
    initialValue: null,
    onChange: next => {
      if (type === 'range') {
        if (typeof next !== 'string') onValueChange?.(next)
      } else if (typeof next === 'string' || next === null) onValueChange?.(next)
    }
  })
  const selected = selection.value
  const start = typeof selected === 'string' ? selected : selected?.start
  const end = typeof selected === 'string' ? selected : selected?.end
  const [cursor, setCursor] = useState(() => civilTime(defaultFocusedDate ?? start ?? today))
  const active = clamp(cursor, lower, upper)
  const first = monthStart(active)
  const next = monthStart(first, 1)
  const weekOffset = (time: number) => (new Date(time).getUTCDay() - weekStart + 7) % 7
  const gridStart = first - weekOffset(first) * dayMs
  const weekCount = Math.ceil((next - gridStart) / (7 * dayMs))
  const weeks = Array.from({ length: weekCount }, (_, i) => gridStart + i * 7 * dayMs)
  const columns = [0, 1, 2, 3, 4, 5, 6]
  const heading = useId()
  const activeButton = useRef<HTMLButtonElement>(null)
  const focusRequested = useRef(false)
  useLayoutEffect(() => {
    if (focusRequested.current) activeButton.current?.focus()
    focusRequested.current = false
  }, [active])

  function move(time: number) {
    const target = clamp(time, lower, upper)
    if (target === active) return
    focusRequested.current = true
    setCursor(target)
  }

  function navigate(event: KeyboardEvent<HTMLButtonElement>, time: number) {
    if (event.altKey || event.metaKey || event.ctrlKey || event.defaultPrevented) return
    const host = event.currentTarget
    const rtl = host.ownerDocument.defaultView?.getComputedStyle(host).direction === 'rtl'
    let target: number
    switch (event.key) {
      case 'ArrowLeft':
        target = time + (rtl ? 1 : -1) * dayMs
        break
      case 'ArrowRight':
        target = time + (rtl ? -1 : 1) * dayMs
        break
      case 'ArrowUp':
        target = time - 7 * dayMs
        break
      case 'ArrowDown':
        target = time + 7 * dayMs
        break
      case 'Home':
        target = time - weekOffset(time) * dayMs
        break
      case 'End':
        target = time + (6 - weekOffset(time)) * dayMs
        break
      case 'PageUp':
        target = shiftMonth(time, event.shiftKey ? -12 : -1)
        break
      case 'PageDown':
        target = shiftMonth(time, event.shiftKey ? 12 : 1)
        break
      default:
        return
    }
    event.preventDefault()
    move(target)
  }

  function pick(date: string) {
    if (type !== 'range') return selection.request(date)
    if (!start || end || start < min || start > max)
      return selection.request({ start: date, end: null })
    const [from, to] = start < date ? [start, date] : [date, start]
    // A new endpoint beyond an unavailable day begins a fresh range.
    if (rangeHasDisabledDate(from, to, isDateDisabled))
      return selection.request({ start: date, end: null })
    selection.request({ start: from, end: to })
  }

  function dayCell(time: number) {
    if (time < first || time >= next)
      return (
        <td
          key={time}
          aria-hidden="true"
        />
      )
    const date = isoDate(time)
    const unavailable = time < lower || time > upper || isDateDisabled?.(date)
    const inRange = !!start && date >= start && date <= (end ?? start)
    const endpoint = date === start || date === end
    return (
      <td
        key={time}
        aria-selected={inRange}
        className="p-0 text-center"
      >
        <Button
          ref={time === active ? activeButton : undefined}
          data-slot="calendar-day"
          data-date={date}
          aria-label={labels.date.format(time)}
          aria-current={date === today ? 'date' : undefined}
          disabled={time < lower || time > upper}
          aria-disabled={unavailable || undefined}
          tabIndex={time === active ? 0 : -1}
          controlSize={controlSize}
          tone={inRange ? 'accent' : 'neutral'}
          variant={endpoint ? 'solid' : inRange ? 'soft' : 'ghost'}
          className={cn(
            inlineActionClass,
            'w-full min-w-0 px-0 tabular-nums aria-disabled:cursor-not-allowed aria-disabled:line-through aria-disabled:opacity-60 aria-[current=date]:underline forced-colors:in-aria-selected:outline'
          )}
          onFocus={() => {
            if (time >= lower && time <= upper) setCursor(time)
          }}
          onKeyDown={event => navigate(event, time)}
          onClick={() => {
            if (!unavailable) {
              setCursor(time)
              pick(date)
              onDaySelect?.(date)
            }
          }}
        >
          {labels.day.format(new Date(time).getUTCDate())}
        </Button>
      </td>
    )
  }

  function monthButton(offset: number, label: string | undefined, disabled: boolean) {
    const target = shiftMonth(active, offset)
    return (
      <Button
        variant="ghost"
        tone="neutral"
        iconOnly
        controlSize={controlSize}
        disabled={disabled}
        aria-label={label ?? labels.month.format(target)}
        data-slot={offset < 0 ? 'calendar-previous' : 'calendar-next'}
        className={inlineActionClass}
        onClick={() => move(target)}
      >
        <StandardIcon
          name={offset < 0 ? 'chevronLeft' : 'chevronRight'}
          className="rtl:rotate-180"
          fallback={
            <span
              aria-hidden="true"
              className="text-xl rtl:rotate-180"
            >
              {offset < 0 ? '‹' : '›'}
            </span>
          }
        />
      </Button>
    )
  }

  return (
    <section
      {...host}
      data-slot="calendar"
      className={cn(
        'box-border w-80 max-w-full rounded-[var(--rad-control-radius,0.5rem)] border border-solid border-[color:var(--rad-color-border)] bg-[var(--rad-color-surface)] p-2 text-[color:var(--rad-color-foreground)] font-[family-name:var(--rad-typography-roles-ui-body-family,system-ui,sans-serif)]',
        className
      )}
    >
      <div className="flex items-center justify-between gap-1">
        {monthButton(-1, previousMonthLabel, first <= lower)}
        <span
          id={heading}
          aria-live="polite"
          aria-atomic="true"
          className="text-center font-semibold"
        >
          {labels.month.format(active)}
        </span>
        {monthButton(1, nextMonthLabel, next > upper)}
      </div>
      <table
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role -- This interactive date grid retains native table rows and cells.
        role="grid"
        aria-labelledby={heading}
        aria-multiselectable={type === 'range' || undefined}
        className="w-full table-fixed border-collapse"
      >
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col}
                scope="col"
                abbr={labels.weekdayName.format(gridStart + col * dayMs)}
                className="py-2 text-xs font-medium text-[color:var(--rad-color-muted-foreground)]"
              >
                {labels.weekday.format(gridStart + col * dayMs)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map(week => (
            <tr key={week}>{columns.map(col => dayCell(week + col * dayMs))}</tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

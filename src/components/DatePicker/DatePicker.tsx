'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentProps } from 'react'
import { cn } from 'cn'
import { CalendarRoot, type CalendarProps } from '../Calendar/Calendar.js'
import { useField, useFieldControl, WithoutField } from '../Field/Field.js'
import { InputGroup, InputGroupInput } from '../InputGroup/InputGroup.js'
import { Popover, PopoverContentRoot, PopoverTrigger } from '../Popover/Popover.js'
import { requireAccessibleName } from '../../internal/accessibleName.js'
import { civilTime } from '../../internal/calendar.js'
import { useComposedRefs } from '../../react/useComposedRefs.js'
import { useControllableState } from '../../react/useControllableState.js'
import { useLocale } from '../../react/useLocale.js'
import type { ValueOwner } from '../../react/useNativeOwner.js'
import { inlineActionClass } from '../shared/actionStyles.js'
import { dateSegments, type Segment, type Segments } from './dateSegments.js'

export type DatePickerProps = ValueOwner<string | null> &
  Pick<
    CalendarProps,
    | 'locale'
    | 'calendar'
    | 'firstDayOfWeek'
    | 'today'
    | 'min'
    | 'max'
    | 'isDateDisabled'
    | 'controlSize'
    | 'previousMonthLabel'
    | 'nextMonthLabel'
  > &
  Pick<
    ComponentProps<'input'>,
    | 'id'
    | 'ref'
    | 'name'
    | 'form'
    | 'disabled'
    | 'required'
    | 'readOnly'
    | 'aria-label'
    | 'aria-labelledby'
    | 'aria-describedby'
    | 'aria-invalid'
  > & {
    onValueChange?: (iso: string | null) => void
    calendarLabel?: string
    className?: string
  }

export function DatePicker({
  value,
  defaultValue,
  onValueChange,
  name,
  form,
  readOnly,
  calendarLabel = 'Choose date',
  className,
  controlSize = 'medium',
  locale,
  calendar,
  min,
  max,
  isDateDisabled,
  today,
  firstDayOfWeek,
  previousMonthLabel,
  nextMonthLabel,
  ref,
  ...props
}: DatePickerProps) {
  const field = useField()
  const control = useFieldControl(props)
  const labelledBy = props['aria-labelledby'] ?? field?.labelId
  const label = props['aria-label']
  requireAccessibleName('DatePicker', { 'aria-label': label, 'aria-labelledby': labelledBy })
  requireAccessibleName('DatePicker calendar', { 'aria-label': calendarLabel })
  if (min !== undefined) civilTime(min)
  if (max !== undefined) civilTime(max)
  if (min && max && min > max) throw new RangeError('DatePicker min must be on or before max.')

  const owner = useControllableState({
    name: 'DatePicker value',
    value,
    defaultValue,
    initialValue: null,
    onChange: onValueChange
  })
  const language = useLocale(locale)
  const format = useMemo(() => dateSegments(language, calendar), [language, calendar])
  const [draft, setDraft] = useState<{
    owner: string | null
    format: typeof format
    parts: Segments
  } | null>(null)
  if (draft && (draft.owner !== owner.value || draft.format !== format)) setDraft(null)
  const parts =
    draft && draft.owner === owner.value && draft.format === format
      ? draft.parts
      : format.display(owner.value)
  const allowed = (date: string) =>
    !((min && date < min) || (max && date > max) || isDateDisabled?.(date))
  const parsed = format.parse(parts)
  const invalid = parsed === undefined || (parsed !== null && !allowed(parsed))
  const [open, setOpen] = useState(false)
  const blocked = control.disabled || readOnly
  if (open && blocked) setOpen(false)
  const firstInput = useRef<HTMLInputElement>(null)
  const firstRef = useComposedRefs(firstInput, ref)
  const dayButton = useRef<HTMLButtonElement>(null)
  const order = format.parts
    .map(p => p.type)
    .filter((p): p is Segment => p === 'year' || p === 'month' || p === 'day')

  useLayoutEffect(() => {
    const input = firstInput.current
    input?.setCustomValidity(invalid ? 'Enter a valid, available date.' : '')
    return () => input?.setCustomValidity('')
  }, [invalid, format])
  const resetOwner = useRef(owner.reset)
  useLayoutEffect(() => {
    resetOwner.current = owner.reset
  })
  useEffect(() => {
    const input = firstInput.current
    if (!input) return
    const view = input.ownerDocument.defaultView
    if (!view) return
    const root = input.getRootNode()
    let timer: number | undefined
    const reset = (event: Event) => {
      if (event.target !== input.form) return
      view.clearTimeout(timer)
      timer = view.setTimeout(() => {
        if (event.defaultPrevented || !input.isConnected) return
        resetOwner.current()
        setDraft(null)
        setOpen(false)
      })
    }
    root.addEventListener('reset', reset, true)
    return () => {
      root.removeEventListener('reset', reset, true)
      view.clearTimeout(timer)
    }
  }, [format])

  function edit(segment: Segment, input: HTMLInputElement) {
    const text = format.ascii(input.value)
    const limit = segment === 'year' ? format.maxYearDigits : 2
    if (!/^\d*$/.test(text) || text.length > limit) return
    const updated = { ...parts, [segment]: text }
    const next = format.parse(updated)
    const commit = next !== undefined && (next === null || allowed(next))
    setDraft({ owner: commit ? next : owner.value, format, parts: updated })
    if (commit) owner.request(next)
    if (text.length === limit) {
      const nextPart = order[order.indexOf(segment) + 1]
      if (nextPart)
        input.parentElement
          ?.querySelector<HTMLInputElement>('[data-segment="' + nextPart + '"]')
          ?.focus()
    }
  }

  return (
    <Popover
      open={open && !blocked}
      onOpenChange={setOpen}
    >
      <InputGroup
        data-slot="date-picker"
        controlSize={controlSize}
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- InputGroup owns the shared control surface and groups its labelled segments.
        role="group"
        aria-label={label}
        aria-labelledby={labelledBy}
        className={cn('w-fit max-w-full gap-0', className)}
      >
        <WithoutField>
          {format.parts.map((part, index) => {
            if (part.type !== 'day' && part.type !== 'month' && part.type !== 'year')
              return (
                <span
                  key={index}
                  aria-hidden="true"
                >
                  {part.value}
                </span>
              )
            const segment = part.type
            const first = segment === order[0]
            const year = segment === 'year'
            return (
              <InputGroupInput
                key={segment}
                ref={first ? firstRef : undefined}
                id={first ? control.id : undefined}
                data-segment={segment}
                inputMode="numeric"
                autoComplete="off"
                aria-label={format.names.of(segment)}
                aria-describedby={control['aria-describedby']}
                aria-invalid={control['aria-invalid'] || invalid || undefined}
                disabled={control.disabled}
                readOnly={readOnly}
                required={control.required}
                form={form}
                placeholder={year ? 'yyyy' : segment === 'month' ? 'mm' : 'dd'}
                className={cn(
                  'flex-none text-center tabular-nums focus-visible:underline',
                  year ? 'w-[5ch]' : 'w-[2.7ch]'
                )}
                value={format.localize(parts[segment])}
                onFocus={event => event.currentTarget.select()}
                onChange={event => edit(segment, event.currentTarget)}
              />
            )
          })}
          <PopoverTrigger
            type="button"
            variant="ghost"
            tone="neutral"
            iconOnly
            controlSize={controlSize}
            disabled={blocked}
            aria-label={calendarLabel}
            aria-haspopup="dialog"
            data-slot="date-picker-trigger"
            className={cn(inlineActionClass, 'ms-1')}
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              aria-hidden="true"
            >
              <rect
                x="3"
                y="5"
                width="18"
                height="16"
                rx="2"
              />
              <path d="M7 3v4m10-4v4M3 10h18" />
            </svg>
          </PopoverTrigger>
        </WithoutField>
        <input
          type="hidden"
          name={name}
          form={form}
          disabled={control.disabled}
          value={invalid ? '' : (owner.value ?? '')}
        />
      </InputGroup>
      {open && !blocked && (
        <PopoverContentRoot
          // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- Popover owns the nonmodal top-layer surface.
          role="dialog"
          aria-label={calendarLabel}
          initialFocusRef={dayButton}
          returnFocusRef={firstInput}
          align="end"
          className="w-fit p-0"
        >
          <CalendarRoot
            aria-label={calendarLabel}
            ref={node => {
              dayButton.current =
                node?.querySelector<HTMLButtonElement>(
                  '[data-slot~="calendar-day"][tabindex="0"]'
                ) ?? null
            }}
            locale={language}
            calendar={calendar}
            today={today}
            firstDayOfWeek={firstDayOfWeek}
            controlSize={controlSize}
            previousMonthLabel={previousMonthLabel}
            nextMonthLabel={nextMonthLabel}
            min={min}
            max={max}
            isDateDisabled={isDateDisabled}
            value={owner.value}
            className="border-0"
            onDaySelect={date => {
              setDraft(null)
              owner.request(date)
              setOpen(false)
            }}
          />
        </PopoverContentRoot>
      )}
    </Popover>
  )
}

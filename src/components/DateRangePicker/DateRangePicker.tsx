'use client'

import { useRef, useState, type ReactNode } from 'react'
import { cn } from 'cn'
import type { CalendarProps } from '../Calendar/Calendar.js'
import type { DatePickerProps } from '../DatePicker/DatePicker.js'
import { DateEditor } from '../DatePicker/DateEditor.js'
import { DateCalendarPopup, DateCalendarTrigger } from '../DatePicker/DateCalendar.js'
import { Button } from '../Button/Button.js'
import { Popover } from '../Popover/Popover.js'
import { Field, useField, useFieldControl } from '../Field/Field.js'
import { useControllableState } from '../../react/useControllableState.js'
import type { ValueOwner } from '../../react/useNativeOwner.js'
import { civilTime, rangeHasDisabledDate } from '../../internal/calendar.js'
import { joinIds } from '../../internal/ids.js'

/** Either endpoint can be typed first. Values use ISO civil dates. */
export type DateRangeValue = { start: string | null; end: string | null }
export type DateRangePreset = { label: string; start: string; end: string }
export type DateRangePickerProps = ValueOwner<DateRangeValue> &
  Pick<
    DatePickerProps,
    | 'form'
    | 'disabled'
    | 'required'
    | 'readOnly'
    | 'locale'
    | 'calendar'
    | 'firstDayOfWeek'
    | 'today'
    | 'min'
    | 'max'
    | 'isDateDisabled'
    | 'controlSize'
    | 'calendarLabel'
    | 'previousMonthLabel'
    | 'nextMonthLabel'
    | 'aria-invalid'
    | 'aria-describedby'
    | 'className'
  > & {
    startLabel: ReactNode
    endLabel: ReactNode
    startName?: string
    endName?: string
    /** ISO date to focus when opening the calendar for an empty range. */
    defaultFocusedDate?: CalendarProps['defaultFocusedDate']
    onValueChange?: (range: DateRangeValue) => void
    presets?: readonly DateRangePreset[]
  }

const empty: DateRangeValue = { start: null, end: null }

export function DateRangePicker({
  value,
  defaultValue,
  onValueChange,
  startLabel,
  endLabel,
  startName,
  endName,
  presets,
  calendarLabel = 'Choose date range',
  firstDayOfWeek,
  today,
  defaultFocusedDate,
  previousMonthLabel,
  nextMonthLabel,
  className,
  ...props
}: DateRangePickerProps) {
  const owner = useControllableState({
    name: 'DateRangePicker value',
    value,
    defaultValue,
    initialValue: empty,
    onChange: onValueChange,
    equal: (left, right) => left.start === right.start && left.end === right.end
  })
  const { start, end } = owner.value
  if (start !== null) civilTime(start)
  if (end !== null) civilTime(end)
  if (start && end && start > end)
    throw new RangeError('DateRangePicker end must be on or after start.')
  const field = useField()
  const control = useFieldControl(props)
  const blocked = control.disabled || props.readOnly
  const required = control.required || field?.required
  const [open, setOpen] = useState(false)
  if (open && blocked) setOpen(false)
  const [revision, refresh] = useState(0)
  const firstInput = useRef<HTMLInputElement>(null)
  const editorProps = {
    ...props,
    disabled: control.disabled,
    'aria-invalid': field?.invalid || control['aria-invalid'],
    'aria-describedby': joinIds(field?.describedBy, control['aria-describedby']),
    revision
  }
  // Calendar accepts either selection order. A lone end is its first picked day.
  const calendarValue = start ? { start, end } : end ? { start: end, end: null } : null
  function unavailable(from: string, to: string) {
    return (
      from > to ||
      !!(props.min && from < props.min) ||
      !!(props.max && to > props.max) ||
      rangeHasDisabledDate(from, to, props.isDateDisabled)
    )
  }
  function selectRange(range: DateRangeValue) {
    owner.request(range)
    refresh(current => current + 1)
    if (range.end) setOpen(false)
  }
  return (
    <Popover
      open={open && !blocked}
      onOpenChange={setOpen}
    >
      <div
        data-slot="date-range-picker"
        className={cn('grid w-fit max-w-full gap-2', className)}
      >
        <div className="flex max-w-full flex-wrap items-end gap-3">
          <Field
            label={startLabel}
            required={required || !!end}
            controlId={control.id}
          >
            <DateEditor
              {...editorProps}
              slot="date-range-start"
              ref={firstInput}
              value={start}
              name={startName}
              isDateDisabled={date => unavailable(date, end ?? date)}
              onValueChange={date => owner.request({ start: date, end })}
              onFormReset={() => {
                owner.reset()
                setOpen(false)
              }}
            />
          </Field>
          <Field
            label={endLabel}
            required={required || !!start}
          >
            <DateEditor
              {...editorProps}
              slot="date-range-end"
              value={end}
              name={endName}
              isDateDisabled={date => unavailable(start ?? date, date)}
              onValueChange={date => owner.request({ start, end: date })}
            >
              <DateCalendarTrigger
                label={calendarLabel}
                disabled={blocked}
                controlSize={props.controlSize}
              />
            </DateEditor>
          </Field>
        </div>
        {!!presets?.length && (
          <div className="flex flex-wrap gap-2">
            {presets.map(preset => {
              civilTime(preset.start)
              civilTime(preset.end)
              return (
                <Button
                  key={JSON.stringify([preset.label, preset.start, preset.end])}
                  controlSize={props.controlSize}
                  variant="outline"
                  tone="neutral"
                  disabled={blocked || unavailable(preset.start, preset.end)}
                  onClick={() => selectRange({ start: preset.start, end: preset.end })}
                >
                  {preset.label}
                </Button>
              )
            })}
          </div>
        )}
        {open && !blocked && (
          <DateCalendarPopup
            type="range"
            aria-label={calendarLabel}
            returnFocusRef={firstInput}
            locale={props.locale}
            calendar={props.calendar}
            firstDayOfWeek={firstDayOfWeek}
            today={today}
            min={props.min}
            max={props.max}
            isDateDisabled={props.isDateDisabled}
            controlSize={props.controlSize}
            previousMonthLabel={previousMonthLabel}
            nextMonthLabel={nextMonthLabel}
            defaultFocusedDate={calendarValue ? undefined : defaultFocusedDate}
            value={calendarValue}
            onValueChange={range => {
              if (range) selectRange(range)
            }}
          />
        )}
      </div>
    </Popover>
  )
}

'use client'
import { useRef, useState, type ComponentProps } from 'react'
import type { CalendarProps } from '../Calendar/Calendar.js'
import { useFieldControl } from '../Field/Field.js'
import { Popover } from '../Popover/Popover.js'
import { useComposedRefs } from '../../react/useComposedRefs.js'
import { useControllableState } from '../../react/useControllableState.js'
import type { ValueOwner } from '../../react/useNativeOwner.js'
import { DateEditor } from './DateEditor.js'
import { DateCalendarPopup, DateCalendarTrigger } from './DateCalendar.js'

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
  calendarLabel = 'Choose date',
  firstDayOfWeek,
  previousMonthLabel,
  nextMonthLabel,
  today,
  ref,
  ...props
}: DatePickerProps) {
  const owner = useControllableState({
    name: 'DatePicker value',
    value,
    defaultValue,
    initialValue: null,
    onChange: onValueChange
  })
  const [open, setOpen] = useState(false)
  const [revision, refresh] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const editorRef = useComposedRefs(input, ref)
  const blocked = useFieldControl(props).disabled || props.readOnly
  if (open && blocked) setOpen(false)
  return (
    <Popover
      open={open && !blocked}
      onOpenChange={setOpen}
    >
      <DateEditor
        {...props}
        slot="date-picker"
        ref={editorRef}
        value={owner.value}
        revision={revision}
        onValueChange={owner.request}
        onFormReset={() => {
          owner.reset()
          setOpen(false)
        }}
      >
        <DateCalendarTrigger
          label={calendarLabel}
          controlSize={props.controlSize}
          disabled={blocked}
        />
      </DateEditor>
      {open && !blocked && (
        <DateCalendarPopup
          aria-label={calendarLabel}
          returnFocusRef={input}
          locale={props.locale}
          calendar={props.calendar}
          min={props.min}
          max={props.max}
          isDateDisabled={props.isDateDisabled}
          controlSize={props.controlSize}
          today={today}
          firstDayOfWeek={firstDayOfWeek}
          previousMonthLabel={previousMonthLabel}
          nextMonthLabel={nextMonthLabel}
          value={owner.value}
          onDaySelect={date => {
            refresh(n => n + 1)
            owner.request(date)
            setOpen(false)
          }}
        />
      )}
    </Popover>
  )
}

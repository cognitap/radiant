'use client'

import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent
} from 'react'
import { cn } from 'cn'
import { useField, useFieldControl, WithoutField } from '../Field/Field.js'
import { InputGroup, InputGroupInput } from '../InputGroup/InputGroup.js'
import { NativeSelect } from '../NativeSelect/NativeSelect.js'
import { requireAccessibleName } from '../../internal/accessibleName.js'
import { useFormReset } from '../../react/useFormReset.js'
import { useLocale } from '../../react/useLocale.js'
import { useControllableState } from '../../react/useControllableState.js'
import { useComposedRefs } from '../../react/useComposedRefs.js'
import type { ValueOwner } from '../../react/useNativeOwner.js'
import type { ControlSize } from '../../presentation.js'
import {
  isoTime,
  secondsOf,
  timeRange,
  timeSegments,
  type ClockPart,
  type HourCycle,
  type TimeParts
} from './timeSegments.js'

export type TimeInputProps = ValueOwner<string | null> &
  Pick<
    ComponentProps<'input'>,
    | 'ref'
    | 'id'
    | 'name'
    | 'form'
    | 'className'
    | 'readOnly'
    | 'disabled'
    | 'required'
    | 'aria-label'
    | 'aria-labelledby'
    | 'aria-describedby'
    | 'aria-invalid'
  > & {
    onValueChange?: (time: string | null) => void
    locale?: string
    hourCycle?: HourCycle
    /** Show seconds. Second-precision values, bounds and steps also enable this segment. */
    showSeconds?: boolean
    min?: string
    max?: string
    /** Whole seconds, counted from min or midnight. Defaults to one minute, or one second with seconds shown. */
    step?: number
    controlSize?: ControlSize
  }

const units = { hour: 3600, minute: 60, second: 1, dayPeriod: 43200 }

export function TimeInput({
  value,
  defaultValue,
  onValueChange,
  locale,
  hourCycle,
  showSeconds = false,
  min,
  max,
  step,
  controlSize = 'medium',
  ref,
  name,
  form,
  className,
  readOnly,
  ...props
}: TimeInputProps) {
  const field = useField()
  const control = useFieldControl(props)
  const labelledBy = props['aria-labelledby'] ?? field?.labelId
  const label = props['aria-label']
  requireAccessibleName('TimeInput', { 'aria-label': label, 'aria-labelledby': labelledBy })
  const owner = useControllableState({
    name: 'TimeInput value',
    value,
    defaultValue,
    initialValue: null,
    onChange: onValueChange
  })
  const seconds = owner.value === null ? null : secondsOf(owner.value)
  const withSeconds =
    showSeconds ||
    [owner.value, defaultValue, min, max].some(t => t?.length === 8) ||
    (step !== undefined && step % 60 !== 0)
  const range = timeRange(min, max, step ?? (withSeconds ? 1 : 60))
  const language = useLocale(locale)
  const format = useMemo(
    () => timeSegments(language, hourCycle, withSeconds),
    [language, hourCycle, withSeconds]
  )
  const [draft, setDraft] = useState<{
    owner: string | null
    format: typeof format
    parts: TimeParts
  } | null>(null)
  const editing = draft?.format === format && draft.owner === owner.value
  if (draft && !editing) setDraft(null)
  const parts = editing ? draft.parts : format.display(seconds)
  const parsed = format.parse(parts)
  const invalid = parsed === undefined || (parsed !== null && !range.allows(parsed))
  if (editing && !invalid && parsed !== seconds) setDraft(null)

  const first = useRef<HTMLInputElement>(null)
  const editorRef = useComposedRefs(first, ref)
  useLayoutEffect(() => {
    const input = first.current
    input?.setCustomValidity(invalid ? 'Enter a valid time within the allowed range and step.' : '')
    return () => input?.setCustomValidity('')
  }, [format, invalid])
  useFormReset(first, () => {
    owner.reset()
    setDraft(null)
  })

  function edit(updated: TimeParts) {
    const next = format.parse(updated)
    if (next === undefined || (next !== null && !range.allows(next))) {
      setDraft({ owner: owner.value, format, parts: updated })
      return
    }
    const iso = next === null ? null : isoTime(next, withSeconds)
    setDraft({ owner: iso, format, parts: updated })
    owner.request(iso)
  }
  function editNumber(part: ClockPart, input: HTMLInputElement) {
    const text = format.ascii(input.value)
    if (!/^\d{0,2}$/.test(text)) return
    edit({ ...parts, [part]: text })
    if (text.length === 2) {
      const segments = Array.from(
        input.parentElement?.querySelectorAll<HTMLElement>('[data-segment]') ?? []
      )
      segments[segments.indexOf(input) + 1]?.focus()
    }
  }
  function advance(event: KeyboardEvent, part: keyof TimeParts) {
    if (readOnly || control.disabled || event.altKey || event.metaKey || event.ctrlKey) return
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
    event.preventDefault()
    const direction = event.key === 'ArrowUp' ? 1 : -1
    let from = parsed
    if (from === undefined) {
      const seed = format.display(min === undefined ? 0 : secondsOf(min))
      from =
        format.parse({
          hour: parts.hour || seed.hour,
          minute: parts.minute || seed.minute,
          second: parts.second || seed.second,
          dayPeriod: parts.dayPeriod
        }) ?? seconds
    }
    const next = range.move(from, direction * units[part])
    setDraft(null)
    owner.request(isoTime(next, withSeconds))
  }

  return (
    <InputGroup
      data-slot="time-input"
      controlSize={controlSize}
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- The grouped native controls share one time label.
      role="group"
      aria-labelledby={labelledBy}
      aria-label={label}
      className={cn('w-fit max-w-full gap-0', className)}
    >
      <WithoutField>
        {format.parts.map(({ type: part, value: literal }, index) => {
          if (part === 'dayPeriod')
            return (
              <NativeSelect
                key={part}
                data-segment={part}
                aria-label={format.names.of('dayPeriod')}
                controlSize={controlSize}
                form={form}
                disabled={control.disabled || readOnly}
                aria-describedby={control['aria-describedby']}
                className="h-auto w-auto rounded-none border-0 bg-transparent px-1 shadow-none"
                value={parts.dayPeriod}
                onChange={event =>
                  edit({ ...parts, dayPeriod: event.currentTarget.value === 'pm' ? 'pm' : 'am' })
                }
                onKeyDown={event => advance(event, part)}
              >
                <option value="am">{format.am}</option>
                <option value="pm">{format.pm}</option>
              </NativeSelect>
            )
          if (part !== 'hour' && part !== 'minute' && part !== 'second')
            return (
              <span
                key={index}
                aria-hidden="true"
              >
                {literal}
              </span>
            )
          return (
            <InputGroupInput
              key={part}
              data-segment={part}
              // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- Localized digits need text entry with per-segment spinbutton semantics.
              role="spinbutton"
              aria-valuemin={part === 'hour' ? format.hourMin : 0}
              aria-valuemax={part === 'hour' ? format.hourMax : 59}
              aria-valuenow={parts[part] ? Number(parts[part]) : undefined}
              ref={part === 'hour' ? editorRef : undefined}
              id={part === 'hour' ? control.id : undefined}
              form={form}
              disabled={control.disabled}
              readOnly={readOnly}
              required={control.required}
              aria-label={format.names.of(part)}
              aria-describedby={control['aria-describedby']}
              aria-invalid={invalid || control['aria-invalid'] || undefined}
              placeholder="––"
              autoComplete="off"
              inputMode="numeric"
              className="w-[2.7ch] flex-none text-center tabular-nums focus-visible:underline"
              value={format.localize(parts[part])}
              onFocus={event => event.currentTarget.select()}
              onChange={event => editNumber(part, event.currentTarget)}
              onKeyDown={event => advance(event, part)}
            />
          )
        })}
      </WithoutField>
      <input
        type="hidden"
        name={name}
        form={form}
        disabled={control.disabled}
        value={invalid || seconds === null ? '' : isoTime(seconds, withSeconds)}
      />
    </InputGroup>
  )
}

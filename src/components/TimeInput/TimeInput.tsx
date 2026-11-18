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
import { inlineActionClass } from '../shared/actionStyles.js'
import { focusRingInsetClass } from '../shared/focusStyles.js'
import { Button } from '../Button/Button.js'
import { requireAccessibleName } from '../../internal/accessibleName.js'
import { useFormReset } from '../../react/useFormReset.js'
import { useLocale } from '../../react/useLocale.js'
import { useControllableState } from '../../react/useControllableState.js'
import { useComposedRefs } from '../../react/useComposedRefs.js'
import type { ValueOwner } from '../../react/useNativeOwner.js'
import type { ControlSize } from '../../presentation.js'
import type { ThemeStyle } from '../../themes/defineTheme.js'
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
    /** Styles and theme variables for the shared field wrapper. */
    style?: ThemeStyle
  }

const units = { hour: 3600, minute: 60, second: 1 }

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
  style,
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
  function togglePeriod() {
    edit({ ...parts, dayPeriod: parts.dayPeriod === 'am' ? 'pm' : 'am' })
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
  function advance(event: KeyboardEvent, part: ClockPart) {
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
      style={style}
    >
      <WithoutField>
        {format.parts.map(({ type: part, value: literal }, index) => {
          if (part === 'dayPeriod')
            return (
              <Button
                key={part}
                type="button"
                variant="ghost"
                tone="neutral"
                motion="off"
                data-slot="time-input-period"
                data-segment={part}
                aria-label={[format.names.of(part), format[parts.dayPeriod]]
                  .filter(Boolean)
                  .join(' ')}
                aria-describedby={control['aria-describedby']}
                controlSize={controlSize}
                disabled={control.disabled || readOnly}
                onClick={togglePeriod}
                onKeyDown={event => {
                  if (event.altKey || event.metaKey || event.ctrlKey || event.defaultPrevented)
                    return
                  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                    event.preventDefault()
                    togglePeriod()
                  }
                }}
                className={cn(
                  inlineActionClass,
                  focusRingInsetClass,
                  'min-h-[max(1.5rem,calc(var(--_rad-control-height)-0.75rem))] min-w-6 [--rad-button-border-width:0px] px-1 leading-none',
                  'text-[color:var(--rad-time-input-period-color,var(--rad-color-foreground))] underline decoration-dotted decoration-[color:var(--rad-time-input-period-indicator-color,var(--rad-color-muted-foreground))] underline-offset-4 enabled:hover:decoration-solid disabled:no-underline'
                )}
              >
                {format[parts.dayPeriod]}
              </Button>
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

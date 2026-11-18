'use client'
import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type ComponentProps
} from 'react'
import { cn } from 'cn'
import { useField, useFieldControl, WithoutField } from '../Field/Field.js'
import { InputGroup, InputGroupInput } from '../InputGroup/InputGroup.js'
import { requireAccessibleName } from '../../internal/accessibleName.js'
import { civilTime } from '../../internal/calendar.js'
import { useComposedRefs } from '../../react/useComposedRefs.js'
import { useFormReset } from '../../react/useFormReset.js'
import { useLocale } from '../../react/useLocale.js'
import { dateSegments, type Segment, type Segments } from './dateSegments.js'
import type { CalendarProps } from '../Calendar/Calendar.js'

export type DateEditorControlProps = Pick<
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
  | 'className'
> &
  Pick<CalendarProps, 'controlSize' | 'locale' | 'calendar' | 'min' | 'max' | 'isDateDisabled'>

type EditorProps = DateEditorControlProps & {
  componentName?: 'DatePicker' | 'DateField'
  value: string | null
  onValueChange: (date: string | null) => void
  onFormReset?: () => void
  revision: number
  slot: string
  children?: ReactNode
}
export function DateEditor({
  componentName = 'DatePicker',
  value,
  onValueChange,
  onFormReset,
  revision,
  slot,
  children,
  name,
  form,
  readOnly,
  className,
  controlSize = 'medium',
  locale,
  calendar,
  min,
  max,
  isDateDisabled,
  ref,
  ...props
}: EditorProps) {
  const field = useField()
  const control = useFieldControl(props)
  const labelledBy = props['aria-labelledby'] ?? field?.labelId
  const label = props['aria-label']
  requireAccessibleName(componentName, { 'aria-label': label, 'aria-labelledby': labelledBy })
  if (min !== undefined) civilTime(min)
  if (max !== undefined) civilTime(max)
  if (min && max && min > max)
    throw new RangeError(componentName + ' min must be on or before max.')

  const language = useLocale(locale)
  const format = useMemo(() => dateSegments(language, calendar), [language, calendar])
  const [draft, setDraft] = useState<{
    revision: number
    owner: string | null
    format: typeof format
    parts: Segments
  } | null>(null)
  if (draft && (draft.owner !== value || draft.format !== format || draft.revision !== revision))
    setDraft(null)
  const parts =
    draft && draft.owner === value && draft.format === format && draft.revision === revision
      ? draft.parts
      : format.display(value)
  const allowed = (date: string) =>
    !((min && date < min) || (max && date > max) || isDateDisabled?.(date))
  const parsed = format.parse(parts)
  const invalid = parsed === undefined || (parsed !== null && !allowed(parsed))
  // An edited constraint can make a previously rejected draft valid. Keep the
  // displayed and submitted dates together until the user makes another edit.
  if (draft && !invalid && parsed !== value) setDraft(null)
  const firstInput = useRef<HTMLInputElement>(null)
  const firstRef = useComposedRefs(firstInput, ref)
  const order = format.parts
    .map(p => p.type)
    .filter((p): p is Segment => p === 'year' || p === 'month' || p === 'day')

  useLayoutEffect(() => {
    const input = firstInput.current
    input?.setCustomValidity(invalid ? 'Enter a valid, available date.' : '')
    return () => input?.setCustomValidity('')
  }, [invalid, format])
  useFormReset(firstInput, () => {
    onFormReset?.()
    setDraft(null)
  })

  function edit(segment: Segment, input: HTMLInputElement) {
    const text = format.ascii(input.value)
    const limit = segment === 'year' ? format.maxYearDigits : 2
    if (!/^\d*$/.test(text) || text.length > limit) return
    const updated = { ...parts, [segment]: text }
    const next = format.parse(updated)
    const commit = next !== undefined && (next === null || allowed(next))
    setDraft({ revision, owner: commit ? next : value, format, parts: updated })
    if (commit) onValueChange(next)
    if (text.length === limit) {
      const nextPart = order[order.indexOf(segment) + 1]
      if (nextPart)
        input.parentElement
          ?.querySelector<HTMLInputElement>('[data-segment="' + nextPart + '"]')
          ?.focus()
    }
  }

  return (
    <InputGroup
      data-slot={slot}
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
        {children}
      </WithoutField>
      <input
        type="hidden"
        name={name}
        form={form}
        disabled={control.disabled}
        value={invalid ? '' : (value ?? '')}
      />
    </InputGroup>
  )
}

'use client'

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Locale currency and percent editing requires a native text input with spinbutton semantics. */

import { inlineActionClass } from './actionStyles.js'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { InputProps } from './Input.js'
import { InputGroup, InputGroupAddon, InputGroupInputRoot } from './InputGroup.js'
import { Button } from './Button.js'
import { useFieldControl } from './Field.js'
import { cn } from './cn.js'
import type { PartStyle } from './presentation.js'
import type { DistributiveOmit } from './internal/types.js'
import { requireAccessibleName } from './internal/accessibleName.js'
import {
  addNumberStep,
  clampNumber,
  createNumberAdapter,
  requireFiniteNumber,
  type NumberFieldFormatOptions
} from './internal/numberField.js'
import type { ValueOwner } from './react/useNativeOwner.js'
import { useControllableState } from './react/useControllableState.js'
import { useComposedRefs } from './react/useComposedRefs.js'
export type { NumberFieldFormatOptions } from './internal/numberField.js'

export type NumberFieldProps = DistributiveOmit<
  InputProps,
  | 'value'
  | 'defaultValue'
  | 'type'
  | 'children'
  | 'min'
  | 'max'
  | 'step'
  | 'role'
  | 'aria-valuenow'
  | 'aria-valuemin'
  | 'aria-valuemax'
  | 'aria-valuetext'
> &
  ValueOwner<number | null> & {
    onValueChange?: (value: number | null) => void
    min?: number
    max?: number
    step?: number
    largeStep?: number
    locale?: string
    formatOptions?: NumberFieldFormatOptions
    incrementLabel?: string
    decrementLabel?: string
    parts?: { wrapper?: PartStyle; increment?: PartStyle; decrement?: PartStyle }
  }
/** One editable Input host and one raw native form value. Label with Field or a native label. */
export function NumberField({
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  step = 1,
  largeStep = step * 10,
  locale = 'en-US',
  formatOptions,
  incrementLabel = 'Increase value',
  decrementLabel = 'Decrease value',
  controlSize = 'medium',
  parts,
  ref,
  name,
  form,
  readOnly,
  onChange,
  onBlur,
  onKeyDown,
  onCompositionStart,
  onCompositionEnd,
  ...props
}: NumberFieldProps) {
  for (const [name, number] of [
    ['value', value],
    ['defaultValue', defaultValue],
    ['min', min],
    ['max', max]
  ] as const)
    if (number !== undefined)
      requireFiniteNumber(
        'NumberField ' + name,
        number,
        name === 'value' || name === 'defaultValue'
      )
  requireFiniteNumber('NumberField step', step)
  requireFiniteNumber('NumberField largeStep', largeStep)
  if (step <= 0 || largeStep <= 0 || (min !== undefined && max !== undefined && min > max))
    throw new TypeError('NumberField requires positive steps and min <= max.')
  requireAccessibleName('NumberField increment', { 'aria-label': incrementLabel })
  requireAccessibleName('NumberField decrement', { 'aria-label': decrementLabel })
  const state = useControllableState({
    name: 'NumberField',
    value,
    defaultValue,
    initialValue: null,
    onChange: onValueChange,
    equal: (a, b) => a === b
  })
  const control = useFieldControl(props),
    input = useRef<HTMLInputElement>(null),
    composed = useComposedRefs(input, ref)
  const adapter = useMemo(() => createNumberAdapter(locale, formatOptions), [locale, formatOptions])
  const [draft, setDraft] = useState<{ value: number | null; text: string; key: string } | null>(
    null
  )
  const composing = useRef(false)
  if (draft && (draft.value !== state.value || draft.key !== adapter.key)) setDraft(null)
  const active = draft && draft.value === state.value && draft.key === adapter.key
  const text = active ? draft.text : adapter.format(state.value)
  const parsed = adapter.parse(text)
  const invalid =
    parsed === undefined ||
    (state.value !== null &&
      ((min !== undefined && state.value < min) || (max !== undefined && state.value > max)))
  const latest = useRef({ state, adapter })
  useLayoutEffect(() => {
    latest.current = { state, adapter }
    input.current?.setCustomValidity(
      composing.current
        ? 'Finish entering the number.'
        : invalid
          ? 'Enter a valid number within the allowed range.'
          : ''
    )
  })
  useEffect(() => {
    const node = input.current,
      view = node?.ownerDocument.defaultView
    if (!node || !view) return
    const roots = new Set([node.ownerDocument, node.getRootNode()])
    let timer: number | undefined
    const reset = (event: Event) => {
      if (event.target !== node.form) return
      view.clearTimeout(timer)
      timer = view.setTimeout(() => {
        if (event.defaultPrevented || !node.isConnected) return
        composing.current = false
        latest.current.state.reset()
        setDraft(null)
      }, 0)
    }
    for (const root of roots) root.addEventListener('reset', reset, true)
    return () => {
      for (const root of roots) root.removeEventListener('reset', reset, true)
      view.clearTimeout(timer)
    }
  }, [])
  function edit(text: string) {
    const next = adapter.parse(text)
    setDraft({ text, value: next === undefined ? state.value : next, key: adapter.key })
    if (next !== undefined) state.request(next)
  }
  function move(amount: number) {
    const node = input.current
    if (!node || node.matches(':disabled') || readOnly) return
    const next = addNumberStep(
      (active && parsed !== undefined ? parsed : state.value) ?? 0,
      amount,
      min,
      max
    )
    state.request(next)
    setDraft(null)
    node.focus({ preventScroll: true })
  }
  const atMinimum =
    state.value !== null && addNumberStep(state.value, -step, min, max) === state.value
  const atMaximum =
    state.value !== null && addNumberStep(state.value, step, min, max) === state.value
  const actionClass =
    'h-[calc(var(--_rad-control-height)_-_2*var(--rad-input-group-border-width,var(--rad-control-border-width,1px)))] min-h-0 shrink-0 px-2'
  return (
    <InputGroup
      controlSize={controlSize}
      dir={props.dir}
      data-slot="number-field-wrapper"
      className={cn('gap-[var(--rad-number-field-gap,0.5rem)]', parts?.wrapper?.className)}
      style={parts?.wrapper?.style}
    >
      <InputGroupInputRoot
        {...props}
        {...control}
        ref={composed}
        form={form}
        readOnly={readOnly}
        family="number-field"
        type="text"
        role="spinbutton"
        value={text}
        controlSize={controlSize}
        inputMode={props.inputMode ?? 'decimal'}
        spellCheck={props.spellCheck ?? false}
        aria-valuenow={
          parsed === undefined || parsed === null ? undefined : (state.value ?? undefined)
        }
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={text || undefined}
        aria-invalid={control['aria-invalid'] || (invalid ? true : undefined)}
        onChange={event => {
          onChange?.(event)
          if (readOnly || event.currentTarget.matches(':disabled')) return
          if (composing.current)
            setDraft({ value: state.value, text: event.currentTarget.value, key: adapter.key })
          else edit(event.currentTarget.value)
        }}
        onBlur={event => {
          onBlur?.(event)
          if (readOnly || event.currentTarget.matches(':disabled')) return
          const current = active ? adapter.parse(event.currentTarget.value) : state.value
          if (current !== undefined && current !== null)
            state.request(clampNumber(current, min, max))
          // Unparseable drafts remain editable and block native submission.
          if (current !== undefined) setDraft(null)
        }}
        onKeyDown={event => {
          onKeyDown?.(event)
          if (
            event.defaultPrevented ||
            event.nativeEvent.isComposing ||
            composing.current ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            readOnly ||
            event.currentTarget.matches(':disabled')
          )
            return
          const amount =
            event.key === 'ArrowUp'
              ? step
              : event.key === 'ArrowDown'
                ? -step
                : event.key === 'PageUp'
                  ? largeStep
                  : event.key === 'PageDown'
                    ? -largeStep
                    : undefined
          if (amount === undefined) return
          event.preventDefault()
          move(amount)
        }}
        onCompositionStart={event => {
          onCompositionStart?.(event)
          composing.current = true
        }}
        onCompositionEnd={event => {
          onCompositionEnd?.(event)
          composing.current = false
          if (!readOnly && !event.currentTarget.matches(':disabled'))
            edit(event.currentTarget.value)
        }}
      />
      <input
        type="hidden"
        name={name}
        form={form}
        disabled={control.disabled}
        value={state.value === null ? '' : String(state.value)}
        data-slot="number-field-value"
      />
      <InputGroupAddon data-slot="number-field-actions">
        {([-1, 1] as const).map(sign => (
          <Button
            key={sign}
            type="button"
            tabIndex={-1}
            variant="ghost"
            tone="neutral"
            motion="off"
            controlSize={controlSize}
            aria-label={sign === 1 ? incrementLabel : decrementLabel}
            aria-controls={control.id}
            disabled={control.disabled || readOnly || (sign === 1 ? atMaximum : atMinimum)}
            data-slot={sign === 1 ? 'number-field-increment' : 'number-field-decrement'}
            className={cn(
              inlineActionClass,
              actionClass,
              (sign === 1 ? parts?.increment : parts?.decrement)?.className
            )}
            style={(sign === 1 ? parts?.increment : parts?.decrement)?.style}
            onPointerDown={event => {
              if (event.button === 0) {
                event.preventDefault()
                input.current?.focus({ preventScroll: true })
              }
            }}
            onClick={() => move(sign * step)}
          >
            {sign === 1 ? '+' : '−'}
          </Button>
        ))}
      </InputGroupAddon>
    </InputGroup>
  )
}

'use client'

import { useId, useLayoutEffect, useRef, useState } from 'react'
import { InputRoot, type InputProps } from './Input.js'
import { Tag } from './Tag.js'
import { useFieldControl } from './Field.js'
import { cn } from './cn.js'
import { controlBorderClass, controlMetrics } from './controlStyles.js'
import { joinIds } from './internal/ids.js'
import { sameSelection } from './internal/selection.js'
import { splitTags, tagSeparators, validateTags } from './internal/tags.js'
import type { DistributiveOmit } from './internal/types.js'
import { useControllableState } from './react/useControllableState.js'
import { useComposedRefs } from './react/useComposedRefs.js'
import { useArrayFormBridge } from './react/useArrayFormBridge.js'
import type { ValueOwner } from './react/useNativeOwner.js'
import type { PartStyle } from './presentation.js'

export type TagsInputProps = DistributiveOmit<
  InputProps,
  'value' | 'defaultValue' | 'type' | 'children'
> &
  ValueOwner<string[]> & {
    onValueChange?: (value: string[]) => void
    /** Single-character separators; line breaks in pasted text also separate tags. */
    separators?: readonly string[]
    /** True accepts; false or an error message rejects. Values are trimmed before validation. */
    validate?: (value: string) => boolean | string
    maxCount?: number
    parts?: { wrapper?: PartStyle; tag?: PartStyle; remove?: PartStyle; error?: PartStyle }
  }
const defaultSeparators = [','] as const
// Tags and the text input share one field well, so the native input itself draws no box.
const wellClass = [
  controlBorderClass,
  'box-border flex min-h-[var(--_rad-control-height)] w-full min-w-0 flex-wrap items-center gap-[var(--rad-tags-input-gap,0.5rem)] p-[0.25rem] cursor-text',
  'bg-[var(--rad-input-background,var(--rad-control-field-background,var(--rad-color-surface,oklch(1_0_0))))] [border-width:var(--rad-input-border-width,var(--rad-control-border-width,1px))] [border-style:var(--rad-input-border-style,var(--rad-control-border-style,solid))] [border-color:var(--rad-input-border-color,var(--rad-control-field-border-color,var(--_rad-control-border)))]',
  'rounded-[var(--rad-input-radius,var(--rad-control-radius,0.5rem))] [corner-shape:var(--rad-input-corner-shape,var(--rad-control-corner-shape,round))] [box-shadow:var(--rad-input-shadow,var(--rad-control-field-shadow,none))] [backdrop-filter:var(--rad-control-field-backdrop-filter,none)]',
  'has-[>input:focus-visible]:[outline:var(--rad-input-focus-width,var(--rad-focus-width,2px))_var(--rad-input-focus-style,var(--rad-focus-style,solid))_var(--rad-input-focus-color,var(--rad-color-focus,oklch(0.55_0.13_255)))] has-[>input:focus-visible]:[outline-offset:var(--rad-input-focus-offset,var(--rad-focus-offset,2px))]',
  'has-[>input[data-invalid]]:[border-color:var(--rad-input-invalid-border,var(--rad-color-invalid,oklch(0.56_0.19_25)))]',
  'has-[>input:disabled]:cursor-not-allowed has-[>input:disabled]:bg-[var(--rad-input-disabled-background,var(--rad-color-disabled-background,oklch(0.96_0.005_286)))]',
  'forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:has-[>input:focus-visible]:outline-[Highlight]'
].join(' ')
const innerInputClass =
  'w-auto min-w-[8ch] flex-1 h-[calc(var(--rad-input-height,var(--_rad-control-height))-2*var(--rad-input-border-width,var(--rad-control-border-width,1px))-0.5rem)] ps-[calc(var(--rad-input-padding,var(--_rad-control-padding))-0.25rem)] pe-0 [[data-slot~=tag]~&]:ps-0 rounded-none [border-width:0] [box-shadow:none] [backdrop-filter:none] bg-transparent disabled:[background:transparent] focus-visible:[outline-width:0]'

/** Native text editing and Tag removal; only committed array values are submitted. */
export function TagsInput({
  value,
  defaultValue,
  onValueChange,
  separators = defaultSeparators,
  validate,
  maxCount,
  parts,
  name,
  form,
  disabled,
  required,
  readOnly,
  controlSize = 'medium',
  className,
  ref,
  onChange,
  onKeyDown,
  onPaste,
  onCompositionStart,
  onCompositionEnd,
  ...props
}: TagsInputProps) {
  const control = useFieldControl({
    id: props.id,
    disabled,
    required,
    'aria-describedby': props['aria-describedby'],
    'aria-invalid': props['aria-invalid'],
    'aria-required': props['aria-required']
  })
  const selection = useControllableState({
    name: 'TagsInput',
    value,
    defaultValue: defaultValue ? [...defaultValue] : undefined,
    initialValue: [] as string[],
    equal: sameSelection,
    onChange: (next: string[]) => onValueChange?.([...next])
  })
  validateTags(selection.value)
  if (selection.value.some(value => !value.trim() || value !== value.trim()))
    throw new TypeError('TagsInput values must be nonempty trimmed strings.')
  if (maxCount !== undefined && (!Number.isInteger(maxCount) || maxCount < 0))
    throw new TypeError('TagsInput maxCount must be a nonnegative integer.')
  const delimiters = tagSeparators(separators)
  const [draft, setDraft] = useState(''),
    [error, setError] = useState('')
  const input = useRef<HTMLInputElement>(null),
    composed = useComposedRefs(input, ref),
    composing = useRef(false)
  const message = useId(),
    pending = useRef<string[] | null>(null)
  const draftRequest = useRef<{ values: string[]; remainder: string; error: string } | null>(null)
  const maximum = maxCount === undefined ? Infinity : maxCount
  const limitMessage = `Use at most ${maxCount} tags.`
  const feedback = selection.value.length > maximum ? limitMessage : error
  const unavailable = () => control.disabled || readOnly || !!input.current?.matches(':disabled')
  const request = (next: string[]) => {
    if (unavailable() || sameSelection(next, selection.value)) return
    pending.current = next
    selection.request(next)
    queueMicrotask(() => {
      pending.current = null
    })
  }
  const remove = (value: string) => {
    if (unavailable()) return
    draftRequest.current = null
    request(selection.value.filter(item => item !== value))
    setError('')
    input.current?.focus({ preventScroll: true })
  }
  function add(text: string, final: boolean) {
    if (unavailable()) return
    const { segments, remainder } = splitTags(text, delimiters, final)
    if (!segments.length) return
    const next = [...selection.value],
      rejected: string[] = []
    let reason = ''
    for (const segment of segments) {
      const candidate = segment.trim()
      if (!candidate) continue
      const verdict = validate?.(candidate) ?? true
      const failure = next.includes(candidate)
        ? 'This tag is already added.'
        : next.length >= maximum
          ? limitMessage
          : verdict === true
            ? ''
            : typeof verdict === 'string' && verdict
              ? verdict
              : 'Enter a valid tag.'
      if (failure) {
        rejected.push(segment)
        reason ||= failure
      } else next.push(candidate)
    }
    const rest = [...rejected, ...(remainder ? [remainder] : [])].join(separators[0] ?? ',')
    setError(reason)
    if (sameSelection(next, selection.value)) {
      draftRequest.current = null
      setDraft(rest)
      setError(reason)
      return
    }
    draftRequest.current = { values: next, remainder: rest, error: reason }
    request(next)
  }
  useLayoutEffect(() => {
    const change = draftRequest.current
    if (change && sameSelection(change.values, selection.value)) {
      draftRequest.current = null
      setDraft(change.remainder)
      setError(change.error)
    }
  }, [selection.value])
  const bridgeRef = useArrayFormBridge({
    values: selection.value,
    controlled: selection.controlled,
    pending,
    form,
    validity:
      feedback ||
      (control.required && !selection.value.length ? 'Please enter at least one tag.' : ''),
    reset() {
      selection.reset()
      draftRequest.current = null
      setDraft('')
      setError('')
    }
  })
  const edit = (text: string) => {
    draftRequest.current = null
    setDraft(text)
    setError('')
    if (!composing.current) add(text, false)
  }
  return (
    <div
      data-slot="tags-input-root"
      className="grid min-w-0 gap-[var(--rad-spacing-field-gap,0.375rem)]"
    >
      <div
        data-slot="tags-input-control"
        data-control-size={controlSize}
        className={cn(wellClass, controlMetrics({ controlSize }), parts?.wrapper?.className)}
        style={parts?.wrapper?.style}
        onPointerDown={event => {
          if (event.target !== event.currentTarget || event.button !== 0 || !event.isPrimary) return
          event.preventDefault()
          input.current?.focus()
        }}
      >
        {selection.value.map(value => (
          <Tag
            key={value}
            removeLabel={`Remove ${value}`}
            disabled={!!(control.disabled || readOnly)}
            className={parts?.tag?.className}
            style={parts?.tag?.style}
            parts={{ remove: parts?.remove }}
            onRemove={() => remove(value)}
          >
            {value}
          </Tag>
        ))}
        <InputRoot
          {...props}
          {...control}
          family="tags-input"
          nativeRequired={false}
          type="text"
          name={undefined}
          form={form}
          ref={composed}
          readOnly={readOnly}
          value={draft}
          autoComplete={props.autoComplete ?? 'off'}
          aria-invalid={feedback ? true : control['aria-invalid']}
          aria-describedby={joinIds(control['aria-describedby'], message)}
          controlSize={controlSize}
          className={cn(innerInputClass, className)}
          onChange={event => {
            onChange?.(event)
            edit(event.currentTarget.value)
          }}
          onCompositionStart={event => {
            onCompositionStart?.(event)
            composing.current = true
          }}
          onCompositionEnd={event => {
            onCompositionEnd?.(event)
            composing.current = false
            edit(event.currentTarget.value)
          }}
          onPaste={event => {
            onPaste?.(event)
            if (event.defaultPrevented || unavailable() || composing.current) return
            const text = event.clipboardData.getData('text')
            if (![...text].some(character => delimiters.includes(character))) return
            event.preventDefault()
            const node = event.currentTarget
            const next =
              draft.slice(0, node.selectionStart ?? draft.length) +
              text +
              draft.slice(node.selectionEnd ?? draft.length)
            draftRequest.current = null
            setDraft(next)
            setError('')
            add(next, true)
          }}
          onKeyDown={event => {
            onKeyDown?.(event)
            if (
              event.defaultPrevented ||
              unavailable() ||
              composing.current ||
              event.nativeEvent.isComposing ||
              event.keyCode === 229 ||
              event.ctrlKey ||
              event.metaKey ||
              event.altKey
            )
              return
            if (event.key === 'Enter' && draft.trim()) {
              event.preventDefault()
              add(draft, true)
            } else if (event.key === 'Backspace' && !draft && selection.value.length) {
              event.preventDefault()
              remove(selection.value.at(-1)!)
            }
          }}
        />
      </div>
      <span
        id={message}
        data-slot="tags-input-error"
        aria-live="polite"
        aria-atomic="true"
        className={cn(
          'w-full empty:hidden text-[length:var(--rad-typography-roles-ui-supporting-size,0.8125rem)] [color:var(--rad-color-invalid,oklch(0.56_0.19_25))]',
          parts?.error?.className
        )}
        style={parts?.error?.style}
      >
        {feedback}
      </span>
      <input
        ref={bridgeRef}
        type="text"
        className="sr-only"
        data-slot="tags-input-native"
        form={form}
        disabled={control.disabled}
        readOnly={readOnly}
        aria-hidden="true"
        tabIndex={-1}
        autoComplete="off"
        defaultValue={JSON.stringify(selection.value)}
        onFocus={() => input.current?.focus()}
        onInvalid={event => {
          event.preventDefault()
          input.current?.focus()
        }}
      />
      {selection.value.map(value => (
        <input
          key={value}
          data-slot="tags-input-value"
          type="hidden"
          name={name}
          form={form}
          disabled={control.disabled}
          value={value}
        />
      ))}
    </div>
  )
}

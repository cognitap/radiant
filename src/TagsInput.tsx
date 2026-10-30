'use client'

import { useId, useLayoutEffect, useRef, useState } from 'react'
import { InputRoot, type InputProps } from './Input.js'
import { Tag } from './Tag.js'
import { useFieldControl } from './Field.js'
import { cn } from './cn.js'
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
    onValueChange?: (values: string[]) => void
    /** Single-character separators; line breaks in pasted text also separate tags. */
    separators?: readonly string[]
    /** True accepts; false or an error message rejects. Values are trimmed before validation. */
    validate?: (value: string) => boolean | string
    maxCount?: number
    parts?: { wrapper?: PartStyle; tag?: PartStyle; remove?: PartStyle; message?: PartStyle }
  }
const defaultSeparators = [','] as const

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
      data-slot="tags-input-control"
      className={cn(
        'flex min-w-0 flex-wrap items-center gap-[var(--rad-tags-input-gap,0.5rem)]',
        parts?.wrapper?.className
      )}
      style={parts?.wrapper?.style}
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
        className={cn('w-auto min-w-[8ch] flex-1', className)}
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
      <span
        id={message}
        data-slot="tags-input-message"
        aria-live="polite"
        aria-atomic="true"
        className={cn(
          'w-full empty:hidden text-[length:var(--rad-typography-roles-ui-supporting-size,0.8125rem)] [color:var(--rad-color-invalid,oklch(0.56_0.19_25))]',
          parts?.message?.className
        )}
        style={parts?.message?.style}
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

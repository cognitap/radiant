'use client'

import { useEffect, useRef, useState } from 'react'
import { InputRoot, inputVariants, type InputProps } from './Input.js'
import { useFieldControl } from './Field.js'
import { cn } from './cn.js'
import { controlMetrics } from './controlStyles.js'
import { useComposedRefs } from './react/useComposedRefs.js'
import { useNativeOwner, type ValueOwner } from './react/useNativeOwner.js'
import type { DistributiveOmit } from './internal/types.js'
import type { PartStyle } from './presentation.js'

export type OTPFieldMode = 'numeric' | 'alphanumeric'
export type OTPFieldProps = DistributiveOmit<
  InputProps,
  | 'value'
  | 'defaultValue'
  | 'type'
  | 'children'
  | 'pattern'
  | 'maxLength'
  | 'minLength'
  | 'inputMode'
  | 'autoComplete'
> &
  ValueOwner<string> & {
    length?: number
    mode?: OTPFieldMode
    parts?: { wrapper?: PartStyle; slot?: PartStyle }
  }

/** One native editing/form host; the character slots are purely visual. */
export function OTPField({
  value,
  defaultValue,
  length = 6,
  mode = 'numeric',
  parts,
  ref,
  className,
  controlSize = 'medium',
  onChange,
  onPaste,
  onFocus,
  onBlur,
  onSelect,
  onPointerDown,
  onKeyDown,
  onCompositionStart,
  onCompositionEnd,
  ...props
}: OTPFieldProps) {
  if (!Number.isInteger(length) || length < 1 || length > 32)
    throw new TypeError('OTPField length must be an integer from 1 to 32.')
  if (mode !== 'numeric' && mode !== 'alphanumeric')
    throw new TypeError('OTPField mode must be numeric or alphanumeric.')
  const [configuration] = useState({ length, mode })
  if (configuration.length !== length || configuration.mode !== mode)
    throw new TypeError('OTPField cannot change length or mode. Remount with a new key.')
  const controlled = useNativeOwner('OTPField', value, defaultValue)
  if (
    (value !== undefined && typeof value !== 'string') ||
    (defaultValue !== undefined && typeof defaultValue !== 'string')
  )
    throw new TypeError('OTPField values must be strings.')
  if ((value ?? defaultValue ?? '').length > length)
    throw new TypeError('OTPField values must fit the configured slots.')
  const [local, setLocal] = useState(defaultValue ?? ''),
    [position, setPosition] = useState(0),
    [focused, setFocused] = useState(false)
  const input = useRef<HTMLInputElement>(null),
    composed = useComposedRefs(input, ref),
    composing = useRef(false)
  const control = useFieldControl(props)
  const text = value ?? local
  const normalize = (text: string) =>
    text.replace(mode === 'numeric' ? /[^0-9]/g : /[^a-zA-Z0-9]/g, '').slice(0, length)
  const unavailable = (node: HTMLInputElement) => node.readOnly || node.matches(':disabled')
  const locate = (node: HTMLInputElement) =>
    setPosition(
      (node.selectionDirection === 'backward' ? node.selectionStart : node.selectionEnd) ?? 0
    )
  const replace = (node: HTMLInputElement, next: string, caret: number) => {
    const view = node.ownerDocument.defaultView
    if (!view) return
    Object.getOwnPropertyDescriptor(view.HTMLInputElement.prototype, 'value')!.set!.call(node, next)
    node.dispatchEvent(new view.InputEvent('input', { bubbles: true, inputType: 'insertText' }))
    node.setSelectionRange(Math.min(caret, node.value.length), Math.min(caret, node.value.length))
    locate(node)
  }
  useEffect(() => {
    const node = input.current,
      form = node?.form,
      view = node?.ownerDocument.defaultView
    if (!node || !form || !view || controlled) return
    let timer: number | undefined
    const reset = (event: Event) => {
      view.clearTimeout(timer)
      timer = view.setTimeout(() => {
        if (event.defaultPrevented || !node.isConnected) return
        setLocal(node.value)
        locate(node)
      }, 0)
    }
    form.addEventListener('reset', reset)
    return () => {
      form.removeEventListener('reset', reset)
      view.clearTimeout(timer)
    }
  }, [controlled, props.form])
  const active = Math.min(position, text.length, length - 1)
  return (
    <div
      dir={props.dir}
      data-slot="otp-field-wrapper"
      className={cn(
        'group/otp relative inline-grid max-w-full gap-[var(--rad-otp-field-gap,0.375rem)] has-[:disabled]:cursor-not-allowed',
        controlMetrics({ controlSize }),
        parts?.wrapper?.className
      )}
      style={{
        gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))`,
        width: `calc(${length} * var(--rad-otp-field-slot-size,var(--_rad-control-height)) + ${length - 1} * var(--rad-otp-field-gap,0.375rem))`,
        ...parts?.wrapper?.style
      }}
    >
      <InputRoot
        {...props}
        {...(value === undefined ? { defaultValue } : { value })}
        ref={composed}
        family="otp-field"
        nativeRequired={undefined}
        type="text"
        controlSize={controlSize}
        autoComplete="one-time-code"
        inputMode={mode === 'numeric' ? 'numeric' : 'text'}
        pattern={mode === 'numeric' ? `[0-9]{${length}}` : `[a-zA-Z0-9]{${length}}`}
        maxLength={length}
        spellCheck={props.spellCheck ?? false}
        className={cn('absolute inset-0 z-10 h-full w-full opacity-0', className)}
        onChange={event => {
          const node = event.currentTarget
          if (unavailable(node)) return
          if (!composing.current) {
            const before = node.value,
              caret = node.selectionStart ?? before.length
            node.value = normalize(before)
            const nextCaret = normalize(before.slice(0, caret)).length
            node.setSelectionRange(nextCaret, nextCaret)
          }
          if (!controlled) setLocal(node.value)
          locate(node)
          onChange?.(event)
        }}
        onPaste={event => {
          const node = event.currentTarget
          if (unavailable(node)) return
          onPaste?.(event)
          if (event.defaultPrevented || composing.current) return
          event.preventDefault()
          const start = node.selectionStart ?? node.value.length,
            end = node.selectionEnd ?? start,
            inserted = normalize(event.clipboardData.getData('text')),
            next = normalize(node.value.slice(0, start) + inserted + node.value.slice(end))
          if (next !== node.value) replace(node, next, start + inserted.length)
        }}
        onFocus={event => {
          setFocused(true)
          locate(event.currentTarget)
          onFocus?.(event)
        }}
        onBlur={event => {
          setFocused(false)
          onBlur?.(event)
        }}
        onSelect={event => {
          locate(event.currentTarget)
          onSelect?.(event)
        }}
        onPointerDown={event => {
          onPointerDown?.(event)
          if (event.defaultPrevented || event.button !== 0) return
          const node = event.currentTarget,
            slots = node.parentElement?.querySelectorAll<HTMLElement>(
              '[data-slot="otp-field-slot"]'
            )
          if (!slots?.length) return
          const x = event.clientX
          const index = [...slots].findIndex(slot => {
            const box = slot.getBoundingClientRect()
            return x >= box.left && x <= box.right
          })
          if (index < 0) return
          event.preventDefault()
          node.focus()
          const caret = Math.min(index, node.value.length)
          node.setSelectionRange(caret, caret)
          locate(node)
        }}
        onKeyDown={event => {
          onKeyDown?.(event)
          if (
            event.defaultPrevented ||
            event.shiftKey ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            composing.current
          )
            return
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
          const node = event.currentTarget,
            rtl = node.ownerDocument.defaultView?.getComputedStyle(node).direction === 'rtl',
            forward = (event.key === 'ArrowRight') !== rtl,
            start = node.selectionStart ?? 0,
            end = node.selectionEnd ?? start,
            caret =
              start !== end
                ? forward
                  ? end
                  : start
                : Math.max(0, Math.min(node.value.length, start + (forward ? 1 : -1)))
          event.preventDefault()
          node.setSelectionRange(caret, caret)
          locate(node)
        }}
        onCompositionStart={event => {
          composing.current = true
          onCompositionStart?.(event)
        }}
        onCompositionEnd={event => {
          composing.current = false
          onCompositionEnd?.(event)
          const node = event.currentTarget
          if (unavailable(node)) return
          const next = normalize(node.value)
          if (next !== node.value) replace(node, next, next.length)
        }}
      />
      {Array.from({ length }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          data-slot="otp-field-slot"
          data-active={focused && active === index ? '' : undefined}
          data-invalid={control['data-invalid']}
          className={cn(
            inputVariants(),
            'pointer-events-none flex items-center justify-center px-0 group-has-[:disabled]/otp:opacity-60 data-active:outline-solid data-active:[outline-color:var(--rad-input-focus-color,var(--rad-color-focus,oklch(0.55_0.13_255)))] data-active:[outline-width:var(--rad-focus-width,2px)] data-active:[outline-offset:var(--rad-focus-offset,2px)]',
            parts?.slot?.className
          )}
          style={parts?.slot?.style}
        >
          {text[index] ?? '\u00a0'}
        </span>
      ))}
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import type { InputProps } from './Input.js'
import { InputGroup, InputGroupAddon, InputGroupInputRoot } from './InputGroup.js'
import { Button } from './Button.js'
import { useFieldControl } from './Field.js'
import { cn } from './cn.js'
import { requireAccessibleName } from './internal/accessibleName.js'
import type { DistributiveOmit } from './internal/types.js'
import { useNativeOwner, type ValueOwner } from './react/useNativeOwner.js'
import { useComposedRefs } from './react/useComposedRefs.js'
import type { PartStyle } from './presentation.js'

export type PasswordInputProps = DistributiveOmit<
  InputProps,
  'value' | 'defaultValue' | 'type' | 'children'
> &
  ValueOwner<string> & {
    showLabel?: string
    hideLabel?: string
    parts?: { wrapper?: PartStyle; toggle?: PartStyle }
  }

/** One native password host; visibility never changes its value owner or autofill identity. */
export function PasswordInput({
  value,
  defaultValue,
  showLabel = 'Show password',
  hideLabel = 'Hide password',
  autoComplete = 'current-password',
  controlSize = 'medium',
  parts,
  ref,
  ...props
}: PasswordInputProps) {
  useNativeOwner('PasswordInput', value, defaultValue)
  requireAccessibleName('PasswordInput show action', { 'aria-label': showLabel })
  requireAccessibleName('PasswordInput hide action', { 'aria-label': hideLabel })
  if (
    (value !== undefined && typeof value !== 'string') ||
    (defaultValue !== undefined && typeof defaultValue !== 'string')
  )
    throw new TypeError('PasswordInput values must be strings.')
  const control = useFieldControl(props),
    input = useRef<HTMLInputElement>(null),
    composed = useComposedRefs(input, ref)
  const [visible, setVisible] = useState(false),
    shown = visible && !control.disabled
  useEffect(() => {
    const node = input.current
    if (!node) return
    const hide = () => {
      node.type = 'password'
      setVisible(false)
    }
    if (control.disabled) hide()
    // Capture before consumer submit handlers; association is read at event time,
    // including an external form added or reassociated after mount.
    const observe = (event: Event) => {
      if (node.form && event.target === node.form) hide()
    }
    const roots = new Set([node.ownerDocument, node.getRootNode()])
    for (const root of roots) {
      root.addEventListener('submit', observe, true)
      root.addEventListener('reset', observe, true)
    }
    return () => {
      for (const root of roots) {
        root.removeEventListener('submit', observe, true)
        root.removeEventListener('reset', observe, true)
      }
    }
  }, [control.disabled])
  return (
    <InputGroup
      controlSize={controlSize}
      dir={props.dir}
      data-slot="password-input-wrapper"
      className={cn('gap-[var(--rad-password-input-gap,0.5rem)]', parts?.wrapper?.className)}
      style={parts?.wrapper?.style}
    >
      <InputGroupInputRoot
        {...props}
        {...control}
        {...(value === undefined ? { defaultValue } : { value })}
        family="password-input"
        ref={composed}
        type={shown ? 'text' : 'password'}
        autoComplete={autoComplete}
        controlSize={controlSize}
        spellCheck={props.spellCheck ?? false}
        autoCapitalize={props.autoCapitalize ?? 'none'}
      />
      <InputGroupAddon>
        <Button
          type="button"
          variant="ghost"
          tone="neutral"
          motion="off"
          controlSize={controlSize}
          pressed={shown}
          onPressedChange={setVisible}
          disabled={control.disabled}
          aria-controls={control.id}
          data-slot="password-input-toggle"
          className={cn(
            'h-[calc(var(--_rad-control-height)_-_2*var(--rad-input-group-border-width,var(--rad-control-border-width,1px)))] min-h-0 shrink-0 px-2',
            parts?.toggle?.className
          )}
          style={parts?.toggle?.style}
        >
          {shown ? hideLabel : showLabel}
        </Button>
      </InputGroupAddon>
    </InputGroup>
  )
}

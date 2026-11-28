'use client'

import { inlineActionClass } from '../shared/actionStyles.js'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { InputProps } from '../Input/Input.js'
import { InputGroup, InputGroupAddon, InputGroupInputRoot } from '../InputGroup/InputGroup.js'
import { Button, type ButtonProps } from '../Button/Button.js'
import { useFieldControl } from '../Field/Field.js'
import { cn } from 'cn'
import { requireAccessibleName } from '../../internal/accessibleName.js'
import type { DistributiveOmit } from '../../internal/types.js'
import { useNativeOwner, type ValueOwner } from '../../react/useNativeOwner.js'
import { useComposedRefs } from '../../react/useComposedRefs.js'
import type { PartStyle } from '../../presentation.js'

type RevealMode = 'toggle' | 'hold'

export type PasswordInputProps = DistributiveOmit<
  InputProps,
  'value' | 'defaultValue' | 'type' | 'children'
> &
  ValueOwner<string> & {
    revealMode?: RevealMode
    showLabel?: string
    hideLabel?: string
    showIcon?: ReactNode
    hideIcon?: ReactNode
    parts?: { wrapper?: PartStyle; toggle?: PartStyle }
  }

export function PasswordInput({
  value,
  defaultValue,
  revealMode = 'toggle',
  showLabel = revealMode === 'hold' ? 'Hold to show password' : 'Show password',
  hideLabel = 'Hide password',
  showIcon,
  hideIcon,
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
  const [visible, setVisible] = useState<RevealMode | null>(null)
  const press = useRef<number | 'Enter' | ' ' | null>(null)
  const hold = revealMode === 'hold'
  const shown = visible === revealMode && !control.disabled
  const label = shown && !hold ? hideLabel : showLabel
  const icon = shown ? (hideIcon ?? (hold ? showIcon : undefined)) : showIcon
  const hide = useCallback(() => {
    press.current = null
    if (input.current) input.current.type = 'password'
    setVisible(null)
  }, [])

  useEffect(() => {
    const node = input.current
    if (!node) return
    hide()
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
    // Reset the gesture when its mode or disabled state changes.
  }, [control.disabled, revealMode, hide])

  useEffect(() => {
    if (!hold) return
    const document = input.current?.ownerDocument
    const window = document?.defaultView
    const cancel = () => {
      if (press.current !== null) hide()
    }
    window?.addEventListener('blur', cancel)
    document?.addEventListener('visibilitychange', cancel)
    return () => {
      window?.removeEventListener('blur', cancel)
      document?.removeEventListener('visibilitychange', cancel)
    }
  }, [hold, hide])

  const endPointer: ButtonProps['onPointerUp'] = event => {
    if (press.current === event.pointerId) hide()
  }
  const holdHandlers: ButtonProps | undefined = hold
    ? {
        onPointerDown: event => {
          if (event.button !== 0 || !event.isPrimary || press.current !== null) return
          event.currentTarget.setPointerCapture(event.pointerId)
          press.current = event.pointerId
          setVisible('hold')
        },
        onPointerUp: endPointer,
        onPointerCancel: endPointer,
        onLostPointerCapture: endPointer,
        onPointerMove: event => {
          if (press.current !== event.pointerId) return
          const { left, right, top, bottom } = event.currentTarget.getBoundingClientRect()
          if (
            event.clientX < left ||
            event.clientX > right ||
            event.clientY < top ||
            event.clientY > bottom
          )
            hide()
        },
        onContextMenu: event => {
          if (typeof press.current === 'number') event.preventDefault()
        },
        onKeyDown: event => {
          if (event.key === 'Escape' && press.current !== null) hide()
          if (event.key !== 'Enter' && event.key !== ' ') return
          event.preventDefault()
          if (event.repeat || press.current !== null) return
          press.current = event.key
          setVisible('hold')
        },
        onKeyUp: event => {
          if (press.current === event.key) hide()
        },
        onBlur: () => {
          if (press.current !== null) hide()
        }
      }
    : undefined
  return (
    <InputGroup
      controlSize={controlSize}
      dir={props.dir}
      data-slot="password-input-wrapper"
      className={cn(
        'gap-[var(--rad-password-input-gap,0.5rem)] [--_rad-password-toggle-inset:3px] pe-[var(--_rad-password-toggle-inset)]',
        parts?.wrapper?.className
      )}
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
          {...holdHandlers}
          type="button"
          variant="ghost"
          tone="neutral"
          motion="off"
          controlSize={controlSize}
          onClick={hold ? undefined : () => setVisible(current => (current ? null : 'toggle'))}
          disabled={control.disabled}
          aria-controls={control.id}
          aria-label={icon != null ? label : undefined}
          iconOnly={icon != null}
          data-slot="password-input-toggle"
          className={cn(
            inlineActionClass,
            '[--_rad-password-toggle-offset:calc(var(--rad-input-group-border-width,var(--rad-control-border-width,1px))_+_var(--_rad-password-toggle-inset))]',
            'h-[calc(var(--_rad-control-height)_-_var(--_rad-password-toggle-offset)_-_var(--_rad-password-toggle-offset))] min-h-0 shrink-0 px-2',
            '[--rad-button-radius:max(0px,calc(var(--rad-input-group-radius,var(--_rad-input-group-default-radius))_-_var(--_rad-password-toggle-offset)))] [--rad-button-corner-shape:var(--rad-control-corner-shape,round)]',
            parts?.toggle?.className
          )}
          style={parts?.toggle?.style}
        >
          {icon != null ? <span aria-hidden="true">{icon}</span> : label}
        </Button>
      </InputGroupAddon>
    </InputGroup>
  )
}

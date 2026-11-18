'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { cn } from 'cn'
import { formatColor, parseColor, type ColorFormat } from '../../color/colorValue.js'
import { joinIds } from '../../internal/ids.js'
import type { PartStyle } from '../../presentation.js'
import { useComposedRefs } from '../../react/useComposedRefs.js'
import { useControllableState } from '../../react/useControllableState.js'
import { useFormReset } from '../../react/useFormReset.js'
import type { ValueOwner } from '../../react/useNativeOwner.js'
import { ColorPicker, type ColorPickerProps } from '../ColorPicker/ColorPicker.js'
import { WithoutField, useFieldControl } from '../Field/Field.js'
import type { InputProps } from '../Input/Input.js'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../InputGroup/InputGroup.js'
import { Popover, PopoverContent, PopoverPortal, PopoverTrigger } from '../Popover/Popover.js'

export type ColorInputProps = Omit<InputProps, 'defaultValue' | 'value' | 'type' | 'children'> &
  ValueOwner<string> & {
    format?: ColorFormat
    /** Receives edits as typed and canonical values after blur or picker selection. */
    onValueChange?: (value: string) => void
    pickerLabel?: string
    invalidText?: string
    swatches?: ColorPickerProps['swatches']
    eyedropper?: boolean
    pickerLabels?: ColorPickerProps['labels']
    parts?: { input?: PartStyle; trigger?: PartStyle; popup?: PartStyle }
  }

const checker =
  'repeating-conic-gradient(var(--rad-color-neutral) 0% 25%,var(--rad-color-surface) 0% 50%) 0 0/8px 8px'

export function ColorInput({
  value,
  defaultValue,
  onValueChange,
  format = 'hex',
  pickerLabel = 'Choose color',
  invalidText = 'Enter a hex, RGB, or OKLCH color.',
  swatches,
  eyedropper,
  pickerLabels,
  controlSize = 'medium',
  className,
  style,
  parts,
  name,
  form,
  readOnly,
  onChange,
  onBlur,
  ref,
  'data-slot': slot,
  ...props
}: ColorInputProps) {
  const state = useControllableState({
    name: 'ColorInput value',
    value,
    defaultValue,
    initialValue: '',
    onChange: onValueChange
  })
  const color = parseColor(state.value)
  const normalized = color ? formatColor(color, format) : ''
  const preview = color ? formatColor(color, 'oklch') : ''
  const invalid = state.value !== '' && !color
  const message = invalid ? invalidText || 'Enter a hex, RGB, or OKLCH color.' : ''
  const control = useFieldControl(props)
  const blocked = control.disabled || readOnly
  const input = useRef<HTMLInputElement>(null)
  const inputRef = useComposedRefs(input, ref)
  const popup = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  // Keep the focused descendant mounted while Popover returns focus on close.
  const [pickerMounted, setPickerMounted] = useState(false)
  if (open && blocked) setOpen(false)
  const shown = open && !blocked

  useLayoutEffect(() => {
    input.current?.setCustomValidity(message)
  }, [message])
  useFormReset(input, () => {
    state.reset()
    setOpen(false)
  })

  return (
    <Popover
      open={shown}
      onOpenChange={next => {
        setOpen(next)
        if (next) setPickerMounted(true)
      }}
    >
      <InputGroup
        data-slot={joinIds('color-input', slot)}
        controlSize={controlSize}
        className={className}
        style={style}
      >
        <InputGroupInput
          {...props}
          ref={inputRef}
          type="text"
          form={form}
          readOnly={readOnly}
          value={state.value}
          aria-invalid={invalid ? true : props['aria-invalid']}
          data-slot="color-input-input"
          className={parts?.input?.className}
          style={parts?.input?.style}
          onChange={event => {
            onChange?.(event)
            state.request(event.currentTarget.value)
          }}
          onBlur={event => {
            onBlur?.(event)
            if (!blocked && normalized) state.request(normalized)
          }}
        />
        <InputGroupAddon>
          <PopoverTrigger
            iconOnly
            variant="ghost"
            tone="neutral"
            controlSize={controlSize}
            disabled={blocked}
            aria-label={pickerLabel}
            aria-haspopup="dialog"
            data-slot="color-input-trigger"
            className={cn(
              'size-[calc(var(--_rad-control-height)_-_0.5rem)] px-0 focus-visible:[--_rad-focus-offset:-1px]',
              parts?.trigger?.className
            )}
            style={parts?.trigger?.style}
            motion="off"
          >
            <span
              aria-hidden="true"
              data-slot="color-input-swatch"
              className="size-[calc(var(--_rad-control-height)*0.48)] rounded-[var(--rad-control-radius,0.25rem)] border border-[var(--rad-color-border)] forced-color-adjust-none"
              style={{
                background: preview ? `linear-gradient(${preview},${preview}),${checker}` : checker
              }}
            />
          </PopoverTrigger>
          <PopoverPortal>
            <PopoverContent
              ref={popup}
              initialFocusRef={popup}
              tabIndex={-1}
              // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- Popover owns the nonmodal top layer.
              role="dialog"
              aria-label={pickerLabel}
              align="end"
              data-slot="color-input-popup"
              className={cn('w-[min(20rem,calc(100vw_-_1rem))] p-3', parts?.popup?.className)}
              style={parts?.popup?.style}
            >
              {pickerMounted && (
                <WithoutField>
                  <ColorPicker
                    label={pickerLabel}
                    value={normalized || '#456BE4'}
                    format={format}
                    controlSize={controlSize}
                    swatches={swatches}
                    eyedropper={shown && eyedropper}
                    labels={pickerLabels}
                    onValueChange={state.request}
                  />
                </WithoutField>
              )}
            </PopoverContent>
          </PopoverPortal>
        </InputGroupAddon>
      </InputGroup>
      {name && (
        <input
          type="hidden"
          name={name}
          form={form}
          value={normalized}
          disabled={control.disabled}
          data-slot="color-input-native"
        />
      )}
    </Popover>
  )
}

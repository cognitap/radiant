'use client'

import { useLayoutEffect, useRef, useState, type ComponentProps } from 'react'
import { cn } from 'cn'
import { requireAccessibleName } from '../../internal/accessibleName.js'
import { joinIds } from '../../internal/ids.js'
import type { ControlSize, PartStyle } from '../../presentation.js'
import { useControllableState } from '../../react/useControllableState.js'
import type { ValueOwner } from '../../react/useNativeOwner.js'
import { Button } from '../Button/Button.js'
import { Field, useField } from '../Field/Field.js'
import { Input } from '../Input/Input.js'

export type InlineEditProps = Omit<
  ComponentProps<'div'>,
  'children' | 'style' | 'value' | 'defaultValue' | 'onChange' | 'dangerouslySetInnerHTML'
> &
  ValueOwner<string> & {
    inputLabel: string
    editLabel?: string
    saveLabel?: string
    cancelLabel?: string
    placeholder?: string
    disabled?: boolean
    controlSize?: ControlSize
    /** Return an error to keep the draft open and focus the input. */
    validate?: (draft: string) => string | undefined
    onValueChange?: (value: string) => void
    style?: PartStyle['style']
    'data-slot'?: string
  }

type Draft = { text: string; error?: string; requested?: string }

export function InlineEdit({
  value,
  defaultValue,
  onValueChange,
  inputLabel,
  editLabel = 'Edit',
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
  placeholder,
  disabled: disabledProp,
  controlSize = 'medium',
  validate,
  className,
  'data-slot': slot,
  ...props
}: InlineEditProps) {
  requireAccessibleName('InlineEdit input', { 'aria-label': inputLabel })
  requireAccessibleName('InlineEdit edit action', { 'aria-label': editLabel })
  requireAccessibleName('InlineEdit save action', { 'aria-label': saveLabel })
  requireAccessibleName('InlineEdit cancel action', { 'aria-label': cancelLabel })
  const field = useField()
  const disabled = disabledProp || field?.disabled
  const owner = useControllableState({
    name: 'InlineEdit value',
    value,
    defaultValue,
    initialValue: '',
    onChange: onValueChange
  })
  const [draft, setDraft] = useState<Draft | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const wasEditing = useRef(false)
  const accepted = draft?.requested !== undefined && draft.requested === owner.value
  if (draft && (accepted || disabled)) setDraft(null)
  const editing = draft !== null && !accepted && !disabled

  useLayoutEffect(() => {
    if (editing) {
      input.current?.focus()
      input.current?.select()
    } else if (wasEditing.current && !disabled) {
      trigger.current?.focus()
    }
    wasEditing.current = editing
  }, [editing, disabled])

  function save() {
    if (!draft) return
    const error = validate?.(draft.text)
    if (error) {
      setDraft({ text: draft.text, error })
      input.current?.focus()
      return
    }
    if (owner.controlled && draft.text !== owner.value) {
      setDraft({ text: draft.text, requested: draft.text })
    } else {
      setDraft(null)
    }
    owner.request(draft.text)
  }

  return (
    <div
      {...props}
      className={cn('grid min-w-0 gap-2', className)}
      data-slot={joinIds('inline-edit', slot)}
    >
      {editing ? (
        <>
          <Field
            label={inputLabel}
            error={draft.error}
            parts={{ label: { className: 'sr-only' } }}
          >
            <Input
              ref={input}
              controlSize={controlSize}
              data-slot="inline-edit-input"
              placeholder={placeholder}
              value={draft.text}
              onChange={event => setDraft({ text: event.currentTarget.value })}
              onKeyDown={event => {
                if (event.nativeEvent.isComposing) return
                if (event.key === 'Enter' || event.key === 'Escape') {
                  event.preventDefault()
                  event.stopPropagation()
                  if (event.key === 'Enter') save()
                  else setDraft(null)
                }
              }}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button
              controlSize={controlSize}
              type="button"
              data-slot="inline-edit-save"
              onClick={save}
            >
              {saveLabel}
            </Button>
            <Button
              controlSize={controlSize}
              type="button"
              variant="outline"
              data-slot="inline-edit-cancel"
              onClick={() => setDraft(null)}
            >
              {cancelLabel}
            </Button>
          </div>
        </>
      ) : (
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span
            data-slot="inline-edit-value"
            className="min-w-0 break-words font-[family-name:var(--rad-typography-roles-ui-body-family,system-ui,sans-serif)]"
          >
            {owner.value || placeholder}
          </span>
          <Button
            ref={trigger}
            type="button"
            variant="outline"
            controlSize={controlSize}
            disabled={disabled}
            data-slot="inline-edit-trigger"
            onClick={() => setDraft({ text: owner.value })}
          >
            {editLabel}
          </Button>
        </div>
      )}
    </div>
  )
}

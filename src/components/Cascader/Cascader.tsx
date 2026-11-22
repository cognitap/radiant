'use client'

import { useId, useLayoutEffect, useRef, useState, type ComponentProps } from 'react'
import { cn } from 'cn'
import { requireAccessibleName } from '../../internal/accessibleName.js'
import { joinIds } from '../../internal/ids.js'
import type { ControlSize, PartStyle } from '../../presentation.js'
import { useComposedRefs } from '../../react/useComposedRefs.js'
import { useControllableState } from '../../react/useControllableState.js'
import { useFormReset } from '../../react/useFormReset.js'
import type { ValueOwner } from '../../react/useNativeOwner.js'
import type { ThemeStyle } from '../../themes/defineTheme.js'
import { Button } from '../Button/Button.js'
import { useField, useFieldControl } from '../Field/Field.js'
import { SelectIcon, SelectViewport } from '../Select/Select.js'
import { SelectPopup } from '../Select/SelectPopup.js'
import { selectTriggerClass } from '../Select/selectStyles.js'
import { controlMetrics } from '../shared/controlStyles.js'
import { useTreeCollection } from '../Tree/Tree.js'
import { treePath, type TreeItem, type TreeNode } from '../Tree/treeModel.js'
import { CascaderColumn, isCascaderBranch } from './CascaderColumn.js'

export type CascaderProps = Pick<
  ComponentProps<'button'>,
  | 'id'
  | 'ref'
  | 'name'
  | 'form'
  | 'disabled'
  | 'aria-label'
  | 'aria-labelledby'
  | 'aria-describedby'
  | 'aria-invalid'
  | 'onClick'
  | 'onKeyDown'
  | 'className'
> &
  ValueOwner<string | null> & {
    items: readonly TreeItem[]
    /** The committed leaf key. */
    onValueChange?: (value: string | null) => void
    /** Optional listbox headings in root-to-leaf order. */
    columnLabels?: readonly string[]
    placeholder?: string
    required?: boolean
    controlSize?: ControlSize
    loadingText?: string
    errorText?: string
    emptyText?: string
    style?: ThemeStyle
    parts?: { content?: PartStyle; column?: PartStyle }
  }

type Cursor = { column: number; value?: string }

export function Cascader({
  items,
  value,
  defaultValue,
  onValueChange,
  columnLabels,
  placeholder = 'Select an item',
  loadingText = 'Loading…',
  errorText = 'Could not load. Retry',
  emptyText = 'No options',
  controlSize = 'medium',
  parts,
  className,
  onClick,
  onKeyDown,
  ref,
  name,
  form,
  ...attributes
}: CascaderProps) {
  const { model, load } = useTreeCollection(items)
  const selection = useControllableState({
    name: 'Cascader value',
    value,
    defaultValue,
    initialValue: null,
    onChange: onValueChange
  })
  const committed = selection.value === null ? undefined : model.byValue.get(selection.value)
  const pathText = treePath(committed)
    .map(node => node.textValue)
    .join(' / ')
  const submitted =
    committed && (committed.disabled || isCascaderBranch(committed)) ? '' : (selection.value ?? '')
  const [branch, setBranch] = useState<string | null>(null)
  const [cursor, setCursor] = useState<Cursor>({ column: 0 })
  const trail = treePath(branch === null ? undefined : model.byValue.get(branch)).filter(
    node => !node.disabled && isCascaderBranch(node)
  )
  const depth = Math.min(cursor.column, trail.length)

  const control = useFieldControl(attributes)
  const field = useField()
  const labelId =
    attributes['aria-labelledby'] ?? (field?.layout === 'control' ? field.labelId : undefined)
  requireAccessibleName('Cascader', {
    'aria-label': attributes['aria-label'],
    'aria-labelledby': labelId
  })
  const id = useId()
  const pickerLabel = labelId ?? id + '-label'
  const contentId = id + '-content'
  const valueId = id + '-value'
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null)
  const triggerRef = useComposedRefs(ref, setTrigger)
  const content = useRef<HTMLDivElement>(null)
  const bridge = useRef<HTMLSelectElement>(null)
  const restoreFocus = useRef(true)
  const [open, setOpen] = useState(false)
  const [reportedInvalid, setReportedInvalid] = useState(false)
  if (open && control.disabled) setOpen(false)
  const shown = open && !control.disabled
  const invalid = control['aria-invalid'] || (reportedInvalid && !submitted) || undefined

  function close(restore = true) {
    restoreFocus.current = restore
    setOpen(false)
  }

  function show() {
    if (control.disabled || trigger?.matches(':disabled')) return
    const parent = committed?.disabled ? null : committed?.parent
    setBranch(parent?.value ?? null)
    setCursor({ column: parent?.level ?? 0, value: committed?.value })
    restoreFocus.current = true
    setOpen(true)
  }

  function navigateInto(node: TreeNode, column: number) {
    if (isCascaderBranch(node)) {
      setBranch(node.value)
      setCursor({ column: column + 1 })
      if (!node.load) load(node)
    } else {
      selection.request(node.value)
      close()
    }
  }

  useLayoutEffect(() => {
    if (!shown) return
    const column = content.current?.querySelector<HTMLElement>(
      '[data-slot="cascader-column"][tabindex="0"]'
    )
    if (!column?.matches(':focus')) column?.focus({ preventScroll: true })
    const target = column?.querySelector('[data-active]') ?? column
    target?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [shown, depth, cursor.value, model])

  useLayoutEffect(() => {
    for (const option of bridge.current?.options ?? []) option.defaultSelected = option.selected
  }, [submitted])
  useFormReset(bridge, () => {
    selection.reset()
    setReportedInvalid(false)
    close(false)
  })

  return (
    <>
      {!labelId && (
        <span
          id={pickerLabel}
          className="sr-only"
        >
          {attributes['aria-label']}
        </span>
      )}
      <Button
        ref={triggerRef}
        id={control.id ?? id + '-trigger'}
        type="button"
        variant="outline"
        tone="neutral"
        controlSize={controlSize}
        disabled={control.disabled}
        motion="off"
        aria-labelledby={joinIds(pickerLabel, valueId)}
        aria-describedby={control['aria-describedby']}
        aria-invalid={invalid}
        aria-controls={trigger ? contentId : undefined}
        aria-haspopup="dialog"
        aria-expanded={shown}
        data-invalid={invalid && invalid !== 'false' ? '' : undefined}
        data-slot="cascader-trigger"
        data-state={shown ? 'open' : 'closed'}
        data-placeholder={selection.value === null ? '' : undefined}
        style={attributes.style}
        render={resolved => (
          <button
            {...resolved}
            className={cn(selectTriggerClass, controlMetrics({ controlSize }), className)}
          />
        )}
        onClick={event => {
          onClick?.(event)
          if (event.defaultPrevented) return
          if (shown) close()
          else show()
        }}
        onKeyDown={event => {
          onKeyDown?.(event)
          if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey) return
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            show()
          }
        }}
      >
        <span
          id={valueId}
          data-slot="cascader-value"
          className="min-w-0 truncate"
        >
          {pathText || selection.value || placeholder}
        </span>
        <SelectIcon data-slot="cascader-icon" />
      </Button>
      {trigger && (
        <SelectPopup
          state={{
            open: shown,
            trigger,
            restoreFocus,
            content,
            close,
            focusInitial: node =>
              node
                .querySelector<HTMLElement>('[data-slot="cascader-column"][tabindex="0"]')
                ?.focus({ preventScroll: true })
          }}
          id={contentId}
          // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- The Select popup uses the popover top layer.
          role="dialog"
          aria-labelledby={pickerLabel}
          controlSize={controlSize}
          position="popper"
          width="content"
          data-slot="cascader-content"
          className={cn(
            '@container/cascader [contain-intrinsic-inline-size:calc(var(--_rad-cascader-columns)*12rem)]',
            parts?.content?.className
          )}
          style={{ '--_rad-cascader-columns': trail.length + 1, ...parts?.content?.style }}
          onKeyDown={event => {
            if (event.defaultPrevented) return
            if (event.key === 'Escape' || (event.key === 'Tab' && event.shiftKey)) {
              event.preventDefault()
              event.stopPropagation()
              close()
            }
          }}
        >
          <SelectViewport className="flex items-stretch overflow-x-auto">
            {[undefined, ...trail].map((parent, column) => {
              const entries = parent?.children ?? model.roots
              const chosen =
                trail[column]?.value ??
                (committed?.parent === (parent ?? null) ? committed?.value : undefined)
              return (
                <CascaderColumn
                  key={parent ? 'branch-' + parent.value : 'root'}
                  id={id + '-column-' + column}
                  items={entries}
                  label={parent?.textValue}
                  labelledBy={parent ? undefined : pickerLabel}
                  heading={columnLabels?.[column]}
                  parent={parent}
                  selected={chosen}
                  current={depth === column ? cursor.value : undefined}
                  focused={depth === column}
                  loadingText={loadingText}
                  errorText={errorText}
                  emptyText={emptyText}
                  part={parts?.column}
                  onMove={value => setCursor({ column, value })}
                  onBack={() => {
                    if (column > 0) setCursor({ column: column - 1, value: parent?.value })
                  }}
                  onActivate={node => navigateInto(node, column)}
                  onRetry={() => {
                    if (parent) load(parent)
                  }}
                />
              )
            })}
          </SelectViewport>
        </SelectPopup>
      )}
      <select
        ref={bridge}
        name={name}
        form={form}
        required={control.required}
        disabled={control.disabled}
        value={submitted}
        onChange={() => {}}
        onInvalid={event => {
          event.preventDefault()
          setReportedInvalid(true)
          trigger?.focus()
        }}
        aria-hidden="true"
        tabIndex={-1}
        className="sr-only"
        data-slot="cascader-native"
      >
        <option value="">{placeholder || 'No selection'}</option>
        {submitted && <option value={submitted}>{pathText || submitted}</option>}
      </select>
    </>
  )
}

'use client'

import { useId, useLayoutEffect, useRef, useState, type ComponentProps } from 'react'
import { cn } from 'cn'
import { requireAccessibleName } from '../../internal/accessibleName.js'
import { composeAction } from '../../internal/events.js'
import { joinIds } from '../../internal/ids.js'
import { sameSelection, type Selection } from '../../internal/selection.js'
import { useComposedRefs } from '../../react/useComposedRefs.js'
import { useControllableState } from '../../react/useControllableState.js'
import { useFormReset } from '../../react/useFormReset.js'
import type { ValueOwner } from '../../react/useNativeOwner.js'
import type { ControlSize, PartStyle } from '../../presentation.js'
import type { ThemeStyle } from '../../themes/defineTheme.js'
import { Badge } from '../Badge/Badge.js'
import { Button } from '../Button/Button.js'
import { useField, useFieldControl } from '../Field/Field.js'
import { SelectIcon, SelectViewport } from '../Select/Select.js'
import { SelectPopup } from '../Select/SelectPopup.js'
import { selectTriggerClass } from '../Select/selectStyles.js'
import { controlMetrics } from '../shared/controlStyles.js'
import { TreeRoot, treeValues, useTreeCollection, type TreeProps } from '../Tree/Tree.js'
import type { TreeNode } from '../Tree/treeModel.js'

type Choice<Value> = ValueOwner<Value> & { onValueChange?: (value: Value) => void }

export type TreeSelectProps = Pick<
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
  Pick<TreeProps, 'items' | 'virtual' | 'loadingText' | 'errorText'> & {
    required?: boolean
    placeholder?: string
    controlSize?: ControlSize
    /** By default, ancestors of initially selected items are expanded. */
    defaultExpanded?: string[]
    parts?: { content?: PartStyle; tree?: PartStyle }
    style?: ThemeStyle
  } & (
    | ({ type?: 'single'; checkboxes?: never } & Choice<string | null>)
    | ({ type: 'multiple'; checkboxes?: boolean } & Choice<string[]>)
  )

function pathTo(node: TreeNode | undefined, fallback: string) {
  const labels: string[] = []
  for (let current = node; current; current = current.parent ?? undefined)
    labels.unshift(current.item.label)
  return labels.length ? labels.join(' / ') : fallback
}

export function TreeSelect(props: TreeSelectProps) {
  const {
    items,
    type = 'single',
    checkboxes,
    value,
    defaultValue,
    onValueChange: _onValueChange,
    defaultExpanded,
    placeholder = 'Select an item',
    controlSize = 'medium',
    virtual,
    loadingText,
    errorText,
    parts,
    className,
    onClick,
    onKeyDown,
    ref,
    name,
    form,
    ...attributes
  } = props
  const multiple = type === 'multiple'
  const collection = useTreeCollection(items)
  const selection = useControllableState<Selection>({
    name: 'TreeSelect value',
    value,
    defaultValue,
    initialValue: multiple ? [] : null,
    equal: sameSelection,
    onChange: next => {
      if (props.type === 'multiple') {
        if (Array.isArray(next)) props.onValueChange?.(next)
      } else if (!Array.isArray(next)) props.onValueChange?.(next)
    }
  })
  treeValues(selection.value, multiple, 'selection')
  const values = Array.isArray(selection.value)
    ? selection.value
    : selection.value === null
      ? []
      : [selection.value]
  const paths = values.map(value => ({
    value,
    path: pathTo(collection.model.byValue.get(value), value)
  }))
  const submitted = paths.filter(item => !collection.model.byValue.get(item.value)?.disabled)
  const control = useFieldControl(attributes)
  const field = useField()
  const id = useId()
  const labelId =
    attributes['aria-labelledby'] ?? (field?.layout === 'control' ? field.labelId : undefined)
  requireAccessibleName('TreeSelect', {
    'aria-label': attributes['aria-label'],
    'aria-labelledby': labelId
  })
  const treeLabel = labelId ?? id + '-label'
  const valueId = id + '-value'
  const treeId = id + '-tree'
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null)
  const triggerRef = useComposedRefs(ref, setTrigger)
  const bridge = useRef<HTMLSelectElement>(null)
  const root = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const restoreFocus = useRef(true)
  const [open, setOpen] = useState(false)
  const [reportedInvalid, setReportedInvalid] = useState(false)
  const [initialExpanded] = useState(() => {
    if (defaultExpanded) return defaultExpanded
    const ancestors = new Set<string>()
    for (const value of values) {
      for (let node = collection.model.byValue.get(value)?.parent; node; node = node.parent)
        ancestors.add(node.value)
    }
    return [...ancestors]
  })
  if (open && control.disabled) setOpen(false)
  const shown = open && !control.disabled
  const invalid =
    control['aria-invalid'] || (reportedInvalid && submitted.length === 0) || undefined

  function close(restore = true) {
    restoreFocus.current = restore
    setOpen(false)
  }
  function show() {
    if (control.disabled || trigger?.matches(':disabled')) return
    restoreFocus.current = true
    setOpen(true)
  }

  useLayoutEffect(() => {
    // A native reset starts from the committed DOM value. The owner then restores its own default.
    for (const option of bridge.current?.options ?? []) option.defaultSelected = option.selected
  })
  useFormReset(bridge, () => {
    selection.reset()
    setReportedInvalid(false)
    close(false)
  })

  const treeProps: TreeProps = {
    'aria-labelledby': treeLabel,
    id: treeId,
    items,
    defaultExpanded: initialExpanded,
    virtual,
    loadingText,
    errorText,
    ref: root,
    className: cn(
      'w-full',
      virtual && 'max-h-[calc(var(--_rad-select-max-height,100dvh)-0.75rem)]',
      parts?.tree?.className
    ),
    style: parts?.tree?.style,
    ...(multiple
      ? {
          type: 'multiple',
          checkboxes,
          value: values,
          onValueChange: (next: string[]) => selection.request(next)
        }
      : {
          value: values[0] ?? null,
          onValueChange: (next: string | null) => selection.request(next)
        })
  }

  return (
    <>
      {!labelId && (
        <span
          id={treeLabel}
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
        aria-labelledby={joinIds(treeLabel, valueId)}
        aria-describedby={control['aria-describedby']}
        aria-invalid={invalid}
        aria-controls={trigger ? treeId : undefined}
        aria-haspopup="tree"
        aria-expanded={shown}
        data-invalid={invalid && invalid !== 'false' ? '' : undefined}
        data-slot="tree-select-trigger"
        data-state={shown ? 'open' : 'closed'}
        data-placeholder={!paths.length ? '' : undefined}
        style={attributes.style}
        render={resolved => (
          <button
            {...resolved}
            className={cn(
              selectTriggerClass,
              controlMetrics({ controlSize }),
              multiple &&
                'h-auto min-h-[var(--rad-select-height,var(--_rad-control-height))] py-1 [&>span:first-child]:justify-start',
              className
            )}
          />
        )}
        onClick={event => composeAction(onClick, () => (shown ? close() : show()))(event)}
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
          data-slot="tree-select-value"
          className={multiple ? 'flex min-w-0 flex-wrap items-center gap-1' : 'min-w-0 truncate'}
        >
          {!paths.length
            ? placeholder
            : multiple
              ? paths.map(({ value, path }) => (
                  <Badge
                    key={value}
                    data-slot="tree-select-tag"
                  >
                    {path}
                  </Badge>
                ))
              : paths[0].path}
        </span>
        <SelectIcon data-slot="tree-select-icon" />
      </Button>
      {trigger && (
        <SelectPopup
          state={{
            open: shown,
            trigger,
            restoreFocus,
            content,
            close,
            focusInitial: () => root.current?.focus({ preventScroll: true })
          }}
          controlSize={controlSize}
          position="popper"
          data-slot="tree-select-content"
          className={parts?.content?.className}
          style={parts?.content?.style}
          onKeyDown={event => {
            if (event.defaultPrevented) return
            if (event.key === 'Escape' || (event.key === 'Tab' && event.shiftKey)) {
              event.preventDefault()
              event.stopPropagation()
              close()
            }
          }}
        >
          <SelectViewport className={virtual ? 'overflow-hidden' : undefined}>
            <TreeRoot
              {...treeProps}
              collection={collection}
              revealOnFocus
              onSelectionCommit={multiple ? undefined : () => close()}
            />
          </SelectViewport>
        </SelectPopup>
      )}
      <select
        ref={bridge}
        name={name}
        form={form}
        multiple={multiple}
        required={control.required}
        disabled={control.disabled}
        value={multiple ? submitted.map(item => item.value) : (submitted[0]?.value ?? '')}
        onChange={() => {}}
        onInvalid={event => {
          event.preventDefault()
          setReportedInvalid(true)
          trigger?.focus()
        }}
        aria-hidden="true"
        aria-labelledby={treeLabel}
        tabIndex={-1}
        className="sr-only"
        data-slot="tree-select-native"
      >
        {!multiple && <option value="">{placeholder || 'No selection'}</option>}
        {submitted.map(({ value, path }) => (
          <option
            key={value}
            value={value}
          >
            {path}
          </option>
        ))}
      </select>
    </>
  )
}

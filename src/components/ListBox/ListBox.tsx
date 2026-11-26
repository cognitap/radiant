'use client'

import { useId, useRef, useState, type ComponentProps, type KeyboardEvent } from 'react'
import { cn } from 'cn'
import { requireAccessibleName } from '../../internal/accessibleName.js'
import { composeAction } from '../../internal/events.js'
import { joinIds } from '../../internal/ids.js'
import { matchSelectText, moveSelectFocus } from '../../internal/select.js'
import {
  isItemOpen,
  sameSelection,
  nextSelection,
  type Selection
} from '../../internal/selection.js'
import type { ControlSize, PartStyle } from '../../presentation.js'
import { useComposedRefs } from '../../react/useComposedRefs.js'
import { useControllableState } from '../../react/useControllableState.js'
import { useFormReset } from '../../react/useFormReset.js'
import { useLocaleMatcher } from '../../react/useLocale.js'
import type { ValueOwner } from '../../react/useNativeOwner.js'
import { useField, useFieldControl } from '../Field/Field.js'
import type { SelectOption } from '../Select/Select.js'
import { controlBorderClass, controlMetrics } from '../shared/controlStyles.js'
import { focusRingClass } from '../shared/focusStyles.js'
import { scrollbarClass } from '../shared/scrollbarStyles.js'

export type ListBoxOption = SelectOption

export type ListBoxProps = Omit<
  ComponentProps<'div'>,
  | 'children'
  | 'style'
  | 'role'
  | 'tabIndex'
  | 'defaultValue'
  | 'value'
  | 'onChange'
  | 'aria-activedescendant'
  | 'aria-multiselectable'
  | 'dangerouslySetInnerHTML'
> & {
  items: readonly ListBoxOption[]
  name?: string
  form?: string
  required?: boolean
  disabled?: boolean
  controlSize?: ControlSize
  style?: PartStyle['style']
  parts?: { option?: PartStyle; indicator?: PartStyle }
  'data-slot'?: string
} & (
    | ({ type?: 'single'; onValueChange?: (value: string | null) => void } & ValueOwner<
        string | null
      >)
    | ({ type: 'multiple'; onValueChange?: (value: string[]) => void } & ValueOwner<string[]>)
  )

const listClass = [
  'group/list-box grid min-w-0 gap-1 overflow-auto p-1',
  controlBorderClass,
  scrollbarClass,
  'bg-[var(--rad-control-field-background,var(--rad-color-surface,white))] text-[var(--rad-color-foreground)]',
  'font-[family-name:var(--rad-typography-roles-ui-body-family,system-ui,sans-serif)] text-[length:var(--_rad-control-font-size)]',
  'data-invalid:[border-color:var(--rad-color-invalid)] data-disabled:opacity-[var(--rad-state-disabled-opacity,0.5)]',
  'forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] forced-colors:border-[CanvasText]',
  focusRingClass
].join(' ')

const optionClass = [
  'flex min-h-[var(--_rad-control-height)] min-w-0 items-center justify-between gap-2 px-[var(--_rad-control-padding)] py-2',
  'rounded-[var(--rad-control-radius,0.5rem)] [corner-shape:var(--rad-control-corner-shape,round)]',
  'cursor-default data-disabled:opacity-[var(--rad-state-disabled-opacity,0.5)]',
  'data-selected:bg-[var(--rad-control-selected-background,transparent)] data-selected:text-[var(--rad-control-selected-foreground,currentColor)]',
  'data-selected:[box-shadow:inset_0_0_0_var(--rad-control-border-width,1px)_var(--rad-control-selected-border-color,transparent)]',
  'group-focus-visible/list-box:data-active:outline-2 group-focus-visible/list-box:data-active:outline-solid group-focus-visible/list-box:data-active:-outline-offset-2 group-focus-visible/list-box:data-active:rad-focus-edge',
  'forced-colors:data-selected:bg-[Highlight] forced-colors:data-selected:text-[HighlightText]',
  'forced-colors:group-focus-visible/list-box:data-active:outline-[CanvasText] forced-colors:data-disabled:text-[GrayText]'
].join(' ')

export function ListBox(props: ListBoxProps) {
  const {
    items,
    name,
    form,
    disabled,
    required,
    controlSize = 'medium',
    id,
    ref,
    className,
    parts,
    type = 'single',
    value,
    defaultValue,
    onValueChange: _onValueChange,
    onKeyDown,
    onClick,
    'aria-label': label,
    'aria-labelledby': labelledBy,
    'aria-describedby': describedBy,
    'aria-invalid': invalid,
    'data-slot': slot,
    ...hostProps
  } = props
  const multiple = type === 'multiple'
  const [initialType] = useState(type)
  if (type !== initialType) throw new TypeError('ListBox needs a new key to change selection mode.')

  const ids = useId()
  const host = useRef<HTMLDivElement>(null)
  const hostRef = useComposedRefs(host, ref)
  const select = useRef<HTMLSelectElement>(null)
  const matcher = useLocaleMatcher()
  const search = useRef({ text: '', at: 0, matcher })
  const field = useField()
  const control = useFieldControl({
    disabled,
    required,
    'aria-describedby': describedBy,
    'aria-invalid': invalid
  })
  const listLabel = labelledBy ?? field?.labelId
  requireAccessibleName('ListBox', { 'aria-label': label, 'aria-labelledby': listLabel })

  const entries = items.map(item => ({
    ...item,
    textValue: item.textValue ?? (typeof item.label === 'string' ? item.label : '')
  }))
  if (
    new Set(entries.map(item => item.value)).size !== items.length ||
    entries.some(item => typeof item.value !== 'string' || !item.value || !item.textValue?.trim())
  ) {
    throw new TypeError('ListBox items need distinct, nonempty string values and readable labels.')
  }
  const owner = useControllableState<Selection>({
    name: 'ListBox value',
    value,
    defaultValue,
    initialValue: multiple ? [] : null,
    equal: sameSelection,
    onChange: next => {
      if (Array.isArray(next)) {
        if (props.type === 'multiple') props.onValueChange?.(next)
      } else if (props.type !== 'multiple') {
        props.onValueChange?.(next)
      }
    }
  })
  const selected = (item: string) => isItemOpen(owner.value, item)
  const [focus, setFocus] = useState<string>()
  const activeIndex = entries.findIndex(item => !item.disabled && item.value === focus)
  const selectedIndex = entries.findIndex(item => !item.disabled && selected(item.value))
  const index =
    activeIndex >= 0
      ? activeIndex
      : selectedIndex >= 0
        ? selectedIndex
        : entries.findIndex(item => !item.disabled)
  const active = entries[index]?.value
  const optionId = (idx: number) => ids + '-option-' + idx
  const nativeValue = multiple
    ? entries.filter(item => selected(item.value)).map(item => item.value)
    : (entries.find(item => selected(item.value))?.value ?? '')

  const initialValue = useRef(owner.value)
  useFormReset(select, () => {
    owner.reset()
    setFocus(undefined)
    const resetValue = owner.controlled ? owner.value : initialValue.current
    const hasSelection = entries.some(item => isItemOpen(resetValue, item.value))
    for (const option of select.current?.options ?? []) {
      option.selected =
        isItemOpen(resetValue, option.value) || (option.value === '' && !hasSelection)
    }
  })

  function move(next: string | undefined) {
    if (next === undefined) return
    setFocus(next)
    const nextIndex = entries.findIndex(item => item.value === next)
    host.current?.ownerDocument
      .getElementById(optionId(nextIndex))
      ?.scrollIntoView({ block: 'nearest' })
  }

  function choose(item: string) {
    owner.request(nextSelection(owner.value, item, !multiple || !selected(item)))
  }

  function navigate(event: KeyboardEvent<HTMLDivElement>) {
    if (event.nativeEvent.isComposing || event.altKey || event.ctrlKey || event.metaKey) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (active !== undefined) choose(active)
    } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault()
      move(moveSelectFocus(entries, active ?? null, event.key))
    } else if (matcher.isSingleKey(event.key)) {
      event.preventDefault()
      const now = event.timeStamp
      const previous = search.current
      const query =
        (previous.matcher === matcher && now - previous.at < 1000 ? previous.text : '') + event.key
      search.current = { text: query, at: now, matcher }
      move(matchSelectText(entries, query, active ?? null, matcher))
    }
  }

  const unavailable = () => !!(control.disabled || select.current?.matches(':disabled'))
  return (
    <>
      <div
        {...hostProps}
        ref={hostRef}
        id={id}
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- The native bridge cannot present rich labels.
        role="listbox"
        tabIndex={control.disabled ? -1 : 0}
        aria-label={label}
        aria-labelledby={listLabel}
        aria-describedby={control['aria-describedby']}
        aria-invalid={control['aria-invalid']}
        aria-required={control['aria-required']}
        aria-multiselectable={multiple || undefined}
        aria-activedescendant={index >= 0 ? optionId(index) : undefined}
        aria-disabled={control.disabled || undefined}
        data-invalid={control['data-invalid']}
        data-disabled={control.disabled ? '' : undefined}
        data-slot={joinIds('list-box', slot)}
        className={cn(listClass, controlMetrics({ controlSize }), className)}
        onKeyDown={event => composeAction(onKeyDown, navigate, unavailable)(event)}
        onClick={event =>
          composeAction(
            onClick,
            event => {
              const option = (event.target as HTMLElement).closest<HTMLElement>(
                '[data-list-box-option]'
              )
              const item = entries[Number(option?.dataset.listBoxOption)]
              if (!item || item.disabled) return
              host.current?.focus({ preventScroll: true })
              setFocus(item.value)
              choose(item.value)
            },
            unavailable
          )(event)
        }
      >
        {entries.map((item, idx) => (
          <div
            key={item.value}
            id={optionId(idx)}
            // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- The corresponding native option lives in the form bridge.
            role="option"
            aria-selected={selected(item.value)}
            aria-disabled={item.disabled || undefined}
            data-list-box-option={idx}
            data-slot="list-box-option"
            data-active={index === idx ? '' : undefined}
            data-selected={selected(item.value) ? '' : undefined}
            data-disabled={item.disabled ? '' : undefined}
            className={cn(optionClass, parts?.option?.className)}
            style={parts?.option?.style}
          >
            <div className="min-w-0 break-words">{item.label}</div>
            <span
              aria-hidden="true"
              data-slot="list-box-indicator"
              className={cn('w-4 shrink-0 text-center', parts?.indicator?.className)}
              style={parts?.indicator?.style}
            >
              {selected(item.value) ? '✓' : ''}
            </span>
          </div>
        ))}
      </div>
      <select
        ref={select}
        id={control.id}
        name={name}
        form={form}
        multiple={multiple}
        required={control.required}
        disabled={control.disabled}
        aria-hidden="true"
        tabIndex={-1}
        className="sr-only"
        data-slot="list-box-native"
        value={nativeValue}
        onChange={event => {
          if (unavailable()) return
          const native = event.currentTarget
          owner.request(
            multiple
              ? Array.from(native.selectedOptions, option => option.value)
              : native.value || null
          )
        }}
        onFocus={() => host.current?.focus({ preventScroll: true })}
        onInvalid={event => {
          event.preventDefault()
          host.current?.focus()
        }}
      >
        {!multiple && <option value="">No selection</option>}
        {entries.map(item => (
          <option
            key={item.value}
            value={item.value}
            disabled={item.disabled}
          >
            {item.textValue}
          </option>
        ))}
      </select>
    </>
  )
}

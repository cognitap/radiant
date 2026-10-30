'use client'

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- An editable combobox uses a native text input and an ARIA listbox; its submitted value has a separate native form bridge. */

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState
} from 'react'
import type { ComponentProps, ReactNode, RefObject } from 'react'
import { createPortal } from 'react-dom'
import { Button, type ButtonProps } from './Button.js'
import { Tag } from './Tag.js'
import { sameSelection, nextSelection, isItemOpen, type Selection } from './internal/selection.js'
import { validateTags } from './internal/tags.js'
import { useArrayFormBridge } from './react/useArrayFormBridge.js'
import { useField, useFieldControl } from './Field.js'
import type { DistributiveOmit } from './internal/types.js'
import { cn } from './cn.js'
import { joinIds } from './internal/ids.js'
import { controlMetrics } from './controlStyles.js'
import {
  comboboxInputClass,
  comboboxContentClass,
  comboboxItemClass,
  comboboxActionClass
} from './comboboxStyles.js'
import { useControllableState } from './react/useControllableState.js'
import { useComposedRefs } from './react/useComposedRefs.js'
import { useTransitionHost } from './motion/host.js'
import { useComboboxPopup } from './react/useComboboxPopup.js'
import type { ValueOwner } from './react/useNativeOwner.js'
import type { ControlSize } from './presentation.js'
import type { ThemeStyle } from './themes/defineTheme.js'

export type ComboboxOption = { value: string; disabled?: boolean } & (
  | { label: string; textValue?: string }
  | { label: ReactNode; textValue: string }
)
type ComboboxCommonProps = {
  items: readonly ComboboxOption[]
  /** Local text matching by default. Pass null for application-filtered results. */
  filter?: ((item: ComboboxOption, query: string) => boolean) | null
  onQueryChange?: (query: string) => void
  loading?: boolean
  error?: ReactNode
  loadingText?: string
  emptyText?: string
  name?: string
  form?: string
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  controlSize?: ControlSize
  children?: ReactNode
} & ({ query: string; defaultQuery?: never } | { query?: undefined; defaultQuery?: string }) &
  ({ open: boolean; defaultOpen?: never } | { open?: undefined; defaultOpen?: boolean }) & {
    onOpenChange?: (open: boolean) => void
  }
export type ComboboxMultipleProps = ComboboxCommonProps &
  ValueOwner<string[]> & {
    multiple: true
    onValueChange?: (value: string[]) => void
    selectedItems?: readonly ComboboxOption[]
    selectedItem?: never
  }
export type ComboboxProps =
  | ComboboxMultipleProps
  | (ComboboxCommonProps &
      ValueOwner<string | null> & {
        multiple?: false
        onValueChange?: (value: string | null) => void
        selectedItem?: ComboboxOption
        selectedItems?: never
      })
export type ComboboxState = {
  value: string | null
  query: string
  open: boolean
  disabled: boolean
  setValue(value: string | null): void
  setQuery(query: string): void
  setOpen(open: boolean): void
}
export type ComboboxMultipleState = Omit<ComboboxState, 'value' | 'setValue'> & {
  value: string[]
  setValue(value: string[]): void
}
type Context = Omit<ComboboxState, 'value' | 'setValue'> & {
  value: Selection
  multiple: boolean
  textInput?: { name?: string; form?: string }
  readOnly: boolean
  setValue(value: Selection): void
  selected: readonly ComboboxOption[]
  remove(value: string): void
  items: readonly ComboboxOption[]
  visible: readonly ComboboxOption[]
  active: string | null
  highlight(value: string | null): void
  text: string
  input: HTMLInputElement | null
  setInput(node: HTMLInputElement | null): void
  content: RefObject<HTMLDivElement | null>
  inputId: string
  listId: string
  optionId(value: string): string
  required: boolean
  controlSize: ControlSize
  loading: boolean
  error?: ReactNode
  status: ReactNode
  dismiss(): void
  commit(value: string | null): void
}
const ComboboxContext = createContext<Context | null>(null)
export function useCombobox(options: { multiple: true }): ComboboxMultipleState | null
export function useCombobox(options?: { multiple?: false }): ComboboxState | null
export function useCombobox(options?: {
  multiple?: boolean
}): ComboboxState | ComboboxMultipleState | null {
  const box = useContext(ComboboxContext)
  if (!box || box.multiple !== !!options?.multiple) return null
  if (Array.isArray(box.value))
    return { ...box, value: box.value, setValue: (value: string[]) => box.setValue(value) }
  return { ...box, value: box.value, setValue: (value: string | null) => box.setValue(value) }
}
function useComboboxContext() {
  const context = useContext(ComboboxContext)
  if (!context) throw new Error('Combobox parts must render inside Combobox.')
  return context
}
/** Private text-mode seam; public families keep their own value contract. */
export function useAutocompleteParts() {
  const box = useContext(ComboboxContext)
  if (!box?.textInput) throw new Error('Autocomplete parts must render inside Autocomplete.')
}
function componentSlot(multiple: boolean, textMode: boolean, name: string) {
  return (
    joinIds(
      name,
      multiple
        ? name.replaceAll('combobox-', 'multi-select-')
        : textMode
          ? name.replaceAll('combobox-', 'autocomplete-')
          : undefined
    ) ?? name
  )
}
const textOf = (item?: ComboboxOption) =>
  item?.textValue ?? (typeof item?.label === 'string' ? item.label : '')
const localFilter = (item: ComboboxOption, query: string) =>
  textOf(item).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())

/** Editable search and committed selection have independent owners; results never select themselves. */
export function Combobox(props: ComboboxProps) {
  return (
    <ComboboxRoot
      {...props}
      textInput={undefined}
    />
  )
}
/** Private composition entry. Text mode edits the actual input instead of a selection carrier. */
export function ComboboxRoot(props: ComboboxProps & { textInput?: { reset: () => void } }) {
  const {
    items,
    textInput,
    value,
    defaultValue,
    selectedItem,
    selectedItems,
    multiple = false,
    filter = localFilter,
    query,
    defaultQuery,
    onQueryChange,
    open,
    defaultOpen,
    onOpenChange,
    loading = false,
    error,
    loadingText = 'Loading results…',
    emptyText = 'No results found.',
    name,
    form,
    disabled: disabledProp,
    readOnly = false,
    required: requiredProp,
    controlSize = 'medium',
    children
  } = props
  const textMode = !!textInput
  if (textMode && multiple) throw new TypeError('Autocomplete is a single text input.')
  const [initialMultiple] = useState(multiple)
  if (multiple !== initialMultiple)
    throw new TypeError('Combobox cannot change multiple mode. Remount with a new key.')
  const selectedOptions = multiple ? (selectedItems ?? []) : selectedItem ? [selectedItem] : []
  const ids = useId()
  const field = useField()
  const disabled = !!(disabledProp || field?.disabled)
  const required = !!(requiredProp || field?.required)
  if (new Set(items.map(item => item.value)).size !== items.length)
    throw new TypeError('Combobox item values must be distinct.')
  if (
    [...items, ...selectedOptions].some(
      item => typeof item.value !== 'string' || !textOf(item).trim()
    )
  )
    throw new TypeError('Combobox items need a string value and readable textValue.')
  const selection = useControllableState<Selection>({
    name: 'Combobox',
    value,
    defaultValue: Array.isArray(defaultValue) ? [...defaultValue] : defaultValue,
    initialValue: multiple ? [] : null,
    equal: sameSelection,
    onChange(next) {
      if (props.multiple) {
        if (!Array.isArray(next)) throw new TypeError('Multiple Combobox value must be an array.')
        props.onValueChange?.([...next])
      } else {
        if (Array.isArray(next))
          throw new TypeError('Single Combobox value must be a string or null.')
        props.onValueChange?.(next)
      }
    }
  })
  if (multiple !== Array.isArray(selection.value))
    throw new TypeError('Combobox value must match its multiple mode.')
  if (Array.isArray(selection.value)) validateTags(selection.value)
  const values = Array.isArray(selection.value)
    ? selection.value
    : selection.value === null
      ? []
      : [selection.value]
  const search = useControllableState({
    name: 'Combobox query',
    value: query,
    defaultValue: defaultQuery,
    initialValue: '',
    onChange: onQueryChange
  })
  const expansion = useControllableState({
    name: 'Combobox open',
    value: open,
    defaultValue: defaultOpen,
    initialValue: false,
    onChange: onOpenChange
  })
  const [input, setInput] = useState<HTMLInputElement | null>(null)
  const content = useRef<HTMLDivElement>(null)
  const bridge = useRef<HTMLInputElement>(null)
  const [active, highlight] = useState<string | null>(null)
  const [searching, setSearching] = useState(!!search.value)
  const [retained, setRetained] = useState(() => new Map<string, ComboboxOption>())
  const selectedEntries = values.map(value => {
    const item = items.find(item => item.value === value) ??
      selectedOptions.find(item => item.value === value) ??
      retained.get(value) ?? { value, label: multiple ? value || 'Selected option' : value }
    return item
  })
  if (selectedEntries.some(item => retained.get(item.value) !== item))
    setRetained(
      new Map<string, ComboboxOption>([
        ...retained,
        ...selectedEntries.map((item): [string, ComboboxOption] => [item.value, item])
      ])
    )
  const selected = selectedEntries[0]
  const unavailable = () => disabled || readOnly || !!input?.matches(':disabled')
  const isOpen = expansion.value && !disabled
  const visible =
    loading || error ? [] : filter ? items.filter(item => filter(item, search.value)) : items
  const enabled = visible.filter(item => !item.disabled)
  const activeValue = enabled.some(item => item.value === active) ? active : null
  if (active !== null && activeValue === null) highlight(null)
  const text = textMode
    ? search.value
    : multiple
      ? search.value
      : isOpen && (searching || search.value !== '')
        ? search.value
        : selected
          ? textOf(selected)
          : typeof selection.value === 'string'
            ? selection.value
            : ''
  const setOpen = (next: boolean) => {
    if (next && unavailable()) return
    expansion.request(next)
    if (!next) highlight(null)
  }
  const dismiss = () => {
    expansion.request(false)
    highlight(null)
    setSearching(false)
    if (!textMode) search.request('')
  }
  const setQuery = (next: string) => {
    if (unavailable()) return
    setSearching(true)
    highlight(null)
    search.request(next)
    setOpen(true)
  }
  const pending = useRef<{ value: string | null } | null>(null)
  const arrayPending = useRef<string[] | null>(null)
  const requestValue = (update: Selection | ((current: Selection) => Selection)) => {
    if (unavailable()) return
    selection.request(current => {
      const next = typeof update === 'function' ? update(current) : update
      if (multiple !== Array.isArray(next))
        throw new TypeError('Combobox value must match its multiple mode.')
      if (Array.isArray(next)) validateTags(next)
      if (!sameSelection(current, next)) {
        if (Array.isArray(next)) arrayPending.current = next
        else pending.current = { value: next }
      }
      return next
    })
    queueMicrotask(() => {
      pending.current = null
      arrayPending.current = null
    })
  }
  const commit = (next: string | null) => {
    if (unavailable() || (next !== null && !enabled.some(item => item.value === next))) return
    if (textMode) {
      const completion = next ?? ''
      if (input && input.value !== completion) {
        const view = input.ownerDocument.defaultView
        if (view) {
          const setter = Object.getOwnPropertyDescriptor(
            view.HTMLInputElement.prototype,
            'value'
          )!.set!
          setter.call(input, completion)
          input.dispatchEvent(new view.Event('input', { bubbles: true }))
        }
      }
      dismiss()
      input?.focus({ preventScroll: true })
      return
    }
    const item = enabled.find(item => item.value === next)
    if (item) setRetained(previous => new Map(previous).set(item.value, item))
    if (multiple) {
      requestValue(current =>
        next === null ? [] : nextSelection(current, next, !isItemOpen(current, next))
      )
      search.request('')
      setSearching(true)
    } else {
      requestValue(next)
      dismiss()
    }
    input?.focus({ preventScroll: true })
  }
  const nativeValue = typeof selection.value === 'string' ? selection.value : ''
  const latest = useRef({ selection, search, nativeValue, expansion, textReset: textInput?.reset })
  useLayoutEffect(() => {
    latest.current = { selection, search, nativeValue, expansion, textReset: textInput?.reset }
  })
  useLayoutEffect(() => {
    if (multiple || textMode) return
    const node = bridge.current
    if (!node) return
    const changedByUser = pending.current && Object.is(pending.current.value, selection.value)
    if (changedByUser) {
      // Bypass React's value tracker so form onChange observes this accepted selection.
      const setter = Object.getOwnPropertyDescriptor(
        node.ownerDocument.defaultView!.HTMLInputElement.prototype,
        'value'
      )!.set!
      setter.call(node, nativeValue)
    } else node.value = nativeValue
    if (selection.controlled) node.defaultValue = nativeValue
    node.setCustomValidity(required && selection.value === null ? 'Please select an option.' : '')
    if (pending.current && Object.is(pending.current.value, selection.value)) {
      pending.current = null
      const EventType = node.ownerDocument.defaultView!.Event
      node.dispatchEvent(new EventType('input', { bubbles: true }))
      node.dispatchEvent(new EventType('change', { bubbles: true }))
    }
  })
  useEffect(() => {
    if (multiple || textMode) return
    const node = bridge.current
    const owner = node?.form
    if (!node || !owner) return
    const win = node.ownerDocument.defaultView!
    let timer: number | undefined
    const reset = (event: Event) => {
      win.clearTimeout(timer)
      timer = win.setTimeout(() => {
        if (event.defaultPrevented || !node.isConnected) return
        latest.current.selection.reset()
        latest.current.search.reset()
        setSearching(false)
        highlight(null)
        latest.current.expansion.request(false)
        node.value = latest.current.nativeValue
      }, 0)
    }
    owner.addEventListener('reset', reset)
    return () => {
      owner.removeEventListener('reset', reset)
      win.clearTimeout(timer)
    }
  }, [input, form, multiple, textMode])
  useEffect(() => {
    if (!textMode || !input) return
    const view = input.ownerDocument.defaultView
    if (!view) return
    const roots = new Set([input.ownerDocument, input.getRootNode()])
    let timer: number | undefined
    const reset = (event: Event) => {
      if (event.target !== input.form) return
      view.clearTimeout(timer)
      timer = view.setTimeout(() => {
        if (event.defaultPrevented || !input.isConnected) return
        latest.current.textReset?.()
        highlight(null)
        latest.current.expansion.request(false)
      }, 0)
    }
    for (const root of roots) root.addEventListener('reset', reset, true)
    return () => {
      for (const root of roots) root.removeEventListener('reset', reset, true)
      view.clearTimeout(timer)
    }
  }, [input, textMode])
  useLayoutEffect(() => {
    if (!isOpen || activeValue === null) return
    const option = content.current?.ownerDocument.getElementById(
      `${ids}-option-${encodeURIComponent(activeValue)}`
    )
    option?.scrollIntoView({ block: 'nearest' })
  }, [activeValue, isOpen, ids])
  const arrayBridgeRef = useArrayFormBridge({
    values: Array.isArray(selection.value) ? selection.value : [],
    controlled: selection.controlled,
    pending: arrayPending,
    form,
    validity: required && values.length === 0 ? 'Please select at least one option.' : '',
    reset() {
      selection.reset()
      search.reset()
      setSearching(false)
      highlight(null)
      expansion.request(false)
    }
  })
  const context: Context = {
    multiple,
    textInput: textMode ? { name, form } : undefined,
    readOnly,
    selected: selectedEntries,
    remove(value) {
      requestValue(current =>
        Array.isArray(current) ? current.filter(item => item !== value) : current
      )
      input?.focus({ preventScroll: true })
    },
    value: selection.value,
    query: search.value,
    open: isOpen,
    disabled,
    setValue: next => {
      if (Array.isArray(next)) {
        if (!multiple) throw new TypeError('Single Combobox value must be a string or null.')
        validateTags(next)
        if (
          next.every(
            value =>
              values.includes(value) || items.some(item => item.value === value && !item.disabled)
          )
        )
          requestValue([...next])
      } else {
        if (multiple) throw new TypeError('Multiple Combobox value must be an array.')
        if (next === null || items.some(item => item.value === next && !item.disabled))
          requestValue(next)
      }
    },
    setQuery,
    setOpen,
    items,
    visible,
    active: activeValue,
    highlight,
    text,
    input,
    setInput,
    content,
    inputId: field?.controlProps?.id ?? `${ids}-input`,
    listId: `${ids}-listbox`,
    optionId: next => `${ids}-option-${encodeURIComponent(next)}`,
    required,
    controlSize,
    loading,
    error,
    status: loading ? loadingText : error || (visible.length === 0 ? emptyText : ''),
    dismiss,
    commit
  }
  return (
    <ComboboxContext.Provider value={context}>
      {children ?? (
        <>
          {multiple && <ComboboxTags />}
          <div
            className="relative w-full min-w-0"
            data-slot={componentSlot(multiple, textMode, 'combobox-control')}
          >
            <ComboboxInput />
            <ComboboxTrigger className="absolute inset-y-0 end-0 w-12" />
          </div>
          <ComboboxPortal>
            <ComboboxContent />
          </ComboboxPortal>
        </>
      )}
      {textMode ? null : multiple ? (
        <>
          <input
            ref={arrayBridgeRef}
            type="text"
            className="sr-only"
            data-slot="combobox-native multi-select-native"
            form={form}
            disabled={disabled}
            readOnly={readOnly}
            aria-hidden="true"
            tabIndex={-1}
            autoComplete="off"
            defaultValue={JSON.stringify(selection.value)}
            onFocus={() => input?.focus()}
            onInvalid={event => {
              event.preventDefault()
              input?.focus()
            }}
          />
          {values.map(value => (
            <input
              key={value}
              type="hidden"
              data-slot="multi-select-value"
              name={name}
              form={form}
              disabled={disabled}
              value={value}
            />
          ))}
        </>
      ) : (
        <input
          ref={bridge}
          readOnly={readOnly}
          className="sr-only"
          data-slot="combobox-native"
          type="text"
          name={name}
          form={form}
          disabled={disabled}
          aria-hidden="true"
          tabIndex={-1}
          autoComplete="off"
          defaultValue={nativeValue}
          onFocus={() => input?.focus()}
          onInvalid={event => {
            event.preventDefault()
            input?.focus()
          }}
        />
      )}
    </ComboboxContext.Provider>
  )
}

export type ComboboxInputProps = Omit<
  ComponentProps<'input'>,
  | 'value'
  | 'defaultValue'
  | 'name'
  | 'form'
  | 'type'
  | 'role'
  | 'disabled'
  | 'required'
  | 'style'
  | 'aria-controls'
  | 'aria-expanded'
  | 'aria-autocomplete'
  | 'aria-activedescendant'
> & { style?: ThemeStyle }
export function ComboboxInput({
  className,
  ref,
  onChange,
  onClick,
  onKeyDown,
  onBlur,
  ...props
}: ComboboxInputProps) {
  const box = useComboboxContext()
  const control = useFieldControl({
    id: props.id ?? box.inputId,
    disabled: box.disabled,
    required: box.required,
    'aria-describedby': props['aria-describedby'],
    'aria-invalid': props['aria-invalid']
  })
  const inputRef = useComposedRefs(box.setInput, ref)
  return (
    <input
      {...props}
      {...control}
      ref={inputRef}
      type="text"
      role="combobox"
      name={box.textInput?.name}
      form={box.textInput?.form}
      required={box.textInput ? control.required : false}
      readOnly={box.readOnly || props.readOnly}
      autoComplete={props.autoComplete ?? 'off'}
      value={box.text}
      className={cn(
        comboboxInputClass,
        controlMetrics({ controlSize: box.controlSize }),
        className
      )}
      data-slot={componentSlot(box.multiple, !!box.textInput, 'combobox-input')}
      data-control-size={box.controlSize}
      aria-autocomplete="list"
      aria-expanded={box.open}
      aria-controls={box.open ? box.listId : undefined}
      aria-activedescendant={box.open && box.active !== null ? box.optionId(box.active) : undefined}
      onChange={event => {
        onChange?.(event)
        box.setQuery(event.currentTarget.value)
      }}
      onClick={event => {
        onClick?.(event)
        if (!event.defaultPrevented) box.setOpen(true)
      }}
      onBlur={event => {
        onBlur?.(event)
        if (
          !box.content.current?.contains(event.relatedTarget) &&
          !event.currentTarget.parentElement?.contains(event.relatedTarget)
        )
          box.dismiss()
      }}
      onKeyDown={event => {
        onKeyDown?.(event)
        if (
          event.defaultPrevented ||
          event.nativeEvent.isComposing ||
          event.keyCode === 229 ||
          event.ctrlKey ||
          event.metaKey
        )
          return
        if (
          box.multiple &&
          event.key === 'Backspace' &&
          box.query === '' &&
          Array.isArray(box.value) &&
          box.value.length
        ) {
          event.preventDefault()
          box.remove(box.value.at(-1)!)
          return
        }
        if (
          !box.textInput &&
          !box.multiple &&
          event.key === 'Escape' &&
          !box.open &&
          box.value !== null
        ) {
          event.preventDefault()
          box.commit(null)
          return
        }
        if (event.key === 'Escape' && box.open) {
          event.preventDefault()
          event.stopPropagation()
          box.dismiss()
          return
        }
        if (box.textInput && event.key === 'Enter' && box.open && box.active === null) {
          box.dismiss()
          return
        }
        if (event.key === 'Tab') {
          box.dismiss()
          return
        }
        if (event.altKey) {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            box.setOpen(true)
          } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            box.dismiss()
          }
          return
        }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault()
          box.setOpen(true)
          const options = box.visible.filter(item => !item.disabled)
          const index = options.findIndex(item => item.value === box.active)
          const next =
            index < 0
              ? event.key === 'ArrowUp'
                ? options.at(-1)
                : options[0]
              : options[
                  Math.max(
                    0,
                    Math.min(options.length - 1, index + (event.key === 'ArrowUp' ? -1 : 1))
                  )
                ]
          box.highlight(next?.value ?? null)
        } else if (event.key === 'Enter' && box.open && box.active !== null) {
          event.preventDefault()
          box.commit(box.active)
        }
      }}
    />
  )
}

export type ComboboxTriggerProps = DistributiveOmit<
  ButtonProps,
  | 'type'
  | 'disabled'
  | 'pending'
  | 'variant'
  | 'tone'
  | 'controlSize'
  | 'iconOnly'
  | 'fullWidth'
  | 'motion'
  | 'tabIndex'
  | 'aria-controls'
  | 'aria-expanded'
>
export function ComboboxTrigger({
  children,
  className,
  render,
  onClick,
  onPointerDown,
  ...props
}: ComboboxTriggerProps) {
  const box = useComboboxContext()
  return (
    <Button
      variant="ghost"
      tone="neutral"
      {...props}
      type="button"
      disabled={box.disabled || box.readOnly}
      pending={false}
      motion="off"
      controlSize={box.controlSize}
      render={resolved => {
        const native = { ...resolved, className: cn(comboboxActionClass, className) }
        return render ? render(native) : <button {...native} />
      }}
      tabIndex={-1}
      aria-label={props['aria-label'] ?? (box.textInput ? 'Show suggestions' : 'Show options')}
      aria-controls={box.open ? box.listId : undefined}
      aria-expanded={box.open}
      data-slot={componentSlot(box.multiple, !!box.textInput, 'button combobox-trigger')}
      onPointerDown={event => {
        onPointerDown?.(event)
        if (!event.defaultPrevented) event.preventDefault()
      }}
      onClick={event => {
        onClick?.(event)
        if (!event.defaultPrevented) {
          box.input?.focus({ preventScroll: true })
          if (box.open) box.dismiss()
          else box.setOpen(true)
        }
      }}
    >
      {children ?? (
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="m4 6 4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      )}
    </Button>
  )
}
export type ComboboxClearProps = ComboboxTriggerProps
export function ComboboxClear({
  children,
  className,
  render,
  onClick,
  onPointerDown,
  ...props
}: ComboboxClearProps) {
  const box = useComboboxContext()
  if (
    box.textInput
      ? box.query === ''
      : box.value === null || (Array.isArray(box.value) && !box.value.length)
  )
    return null
  return (
    <Button
      variant="ghost"
      tone="neutral"
      {...props}
      type="button"
      disabled={box.disabled || box.readOnly}
      pending={false}
      motion="off"
      controlSize={box.controlSize}
      render={resolved => {
        const native = { ...resolved, className: cn(comboboxActionClass, className) }
        return render ? render(native) : <button {...native} />
      }}
      tabIndex={box.multiple ? 0 : -1}
      aria-label={props['aria-label'] ?? (box.textInput ? 'Clear text' : 'Clear selection')}
      data-slot={componentSlot(box.multiple, !!box.textInput, 'button combobox-clear')}
      onPointerDown={event => {
        onPointerDown?.(event)
        if (!event.defaultPrevented) event.preventDefault()
      }}
      onClick={event => {
        onClick?.(event)
        if (!event.defaultPrevented) box.commit(null)
      }}
    >
      {children ?? (
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="m5 5 6 6m0-6-6 6"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      )}
    </Button>
  )
}
export function ComboboxPortal({ children }: { children?: ReactNode }) {
  const box = useComboboxContext()
  return box.input?.parentElement ? createPortal(children, box.input.parentElement) : null
}
export type ComboboxContentProps = Omit<
  ComponentProps<'div'>,
  'style' | 'popover' | 'role' | 'id'
> & {
  style?: ThemeStyle
  sideOffset?: number
  collisionPadding?: number
  motion?: 'inherit' | 'off'
}
export function ComboboxContent({
  children,
  className,
  ref,
  sideOffset = 4,
  collisionPadding = 8,
  motion = 'inherit',
  ...props
}: ComboboxContentProps) {
  const box = useComboboxContext()
  const contentRef = useComposedRefs(box.content, ref)
  const {
    ref: transitionRef,
    active: motionActive,
    off: motionOff
  } = useTransitionHost('popup', contentRef, motion === 'off')
  useComboboxPopup(box.content, box.input, box.open, box.dismiss, sideOffset, collisionPadding)
  return (
    <div
      {...props}
      ref={transitionRef}
      popover="manual"
      data-slot={componentSlot(box.multiple, !!box.textInput, 'combobox-content')}
      data-motion={motion}
      data-state={box.open ? 'open' : 'closed'}
      className={cn(
        comboboxContentClass,
        controlMetrics({ controlSize: box.controlSize }),
        motionActive &&
          !motionOff &&
          'opacity-[var(--_rad-popup-enter,0)] motion-reduce:opacity-100',
        className
      )}
    >
      <div
        id={box.listId}
        role="listbox"
        aria-multiselectable={box.multiple || undefined}
        aria-label={props['aria-label'] ?? box.input?.getAttribute('aria-label') ?? 'Suggestions'}
        aria-labelledby={props['aria-label'] ? undefined : box.input?.labels?.[0]?.id}
        aria-busy={box.loading || undefined}
        data-slot={componentSlot(box.multiple, !!box.textInput, 'combobox-listbox')}
        className="max-h-[calc(var(--_rad-combobox-max-height,100dvh)-0.5rem)] overflow-y-auto overscroll-contain"
      >
        {children ??
          box.visible.map(item => (
            <ComboboxItem
              key={item.value}
              value={item.value}
            />
          ))}
      </div>
      <ComboboxStatus />
    </div>
  )
}
export type ComboboxItemProps = Omit<
  ComponentProps<'div'>,
  'style' | 'id' | 'role' | 'tabIndex'
> & { value: string; style?: ThemeStyle }
export function ComboboxItem({
  value,
  children,
  className,
  onPointerDown,
  onPointerMove,
  onClick,
  ...props
}: ComboboxItemProps) {
  const box = useComboboxContext()
  const item = box.visible.find(item => item.value === value)
  if (!item) return null
  return (
    <div
      {...props}
      id={box.optionId(value)}
      role="option"
      tabIndex={-1}
      onKeyDown={props.onKeyDown}
      aria-selected={box.multiple ? isItemOpen(box.value, value) : box.active === value}
      aria-disabled={item.disabled || undefined}
      data-slot={componentSlot(box.multiple, !!box.textInput, 'combobox-item')}
      data-value={value}
      data-highlighted={box.active === value ? '' : undefined}
      data-selected={isItemOpen(box.value, value) ? '' : undefined}
      data-disabled={item.disabled ? '' : undefined}
      className={cn(comboboxItemClass, className)}
      onPointerDown={event => {
        onPointerDown?.(event)
        if (!event.defaultPrevented) event.preventDefault()
      }}
      onPointerMove={event => {
        onPointerMove?.(event)
        if (!event.defaultPrevented && event.pointerType === 'mouse' && !item.disabled)
          box.highlight(value)
      }}
      onClick={event => {
        onClick?.(event)
        if (!event.defaultPrevented && !item.disabled) box.commit(value)
      }}
    >
      {children ?? (
        <>
          <span className="min-w-0 flex-1">{item.label}</span>
          <span
            aria-hidden="true"
            className={cn(!isItemOpen(box.value, value) && 'invisible')}
          >
            ✓
          </span>
        </>
      )}
    </div>
  )
}
export type ComboboxStatusProps = Omit<ComponentProps<'div'>, 'style' | 'role'> & {
  style?: ThemeStyle
}
export function ComboboxStatus({ children, className, ...props }: ComboboxStatusProps) {
  const box = useComboboxContext()
  return (
    <div
      {...props}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-slot={componentSlot(box.multiple, !!box.textInput, 'combobox-status')}
      className={cn('px-3 py-2 empty:hidden', className)}
    >
      {box.open ? (children ?? box.status) : null}
    </div>
  )
}

export type ComboboxTagsProps = Omit<ComponentProps<'div'>, 'children' | 'style'> & {
  style?: ThemeStyle
}
export function ComboboxTags({ className, ...props }: ComboboxTagsProps) {
  const box = useComboboxContext()
  if (!box.multiple) throw new Error('ComboboxTags requires a multiple Combobox.')
  return (
    <div
      {...props}
      data-slot="combobox-tags multi-select-tags"
      className={cn(
        'flex flex-wrap items-center gap-[var(--rad-multi-select-gap,0.5rem)] mb-[var(--rad-multi-select-gap,0.5rem)] empty:hidden',
        className
      )}
    >
      {box.selected.map(item => (
        <Tag
          key={item.value}
          data-slot="multi-select-tag"
          removeLabel={`Remove ${textOf(item)}`}
          disabled={box.disabled || box.readOnly}
          onRemove={() => box.remove(item.value)}
        >
          {item.label}
        </Tag>
      ))}
    </div>
  )
}

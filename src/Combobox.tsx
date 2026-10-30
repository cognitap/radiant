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
import { useField, useFieldControl } from './Field.js'
import type { DistributiveOmit } from './internal/types.js'
import { cn } from './cn.js'
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
export type ComboboxProps = ValueOwner<string | null> & {
  items: readonly ComboboxOption[]
  onValueChange?: (value: string | null) => void
  /** Application-owned selected option when it is absent from asynchronous results. */
  selectedItem?: ComboboxOption
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
  required?: boolean
  controlSize?: ControlSize
  children?: ReactNode
} & ({ query: string; defaultQuery?: never } | { query?: undefined; defaultQuery?: string }) &
  ({ open: boolean; defaultOpen?: never } | { open?: undefined; defaultOpen?: boolean }) & {
    onOpenChange?: (open: boolean) => void
  }
export type ComboboxState = {
  value: string | null
  query: string
  open: boolean
  disabled: boolean
  setValue(value: string | null): void
  setQuery(query: string): void
  setOpen(open: boolean): void
}
type Context = ComboboxState & {
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
export function useCombobox(): ComboboxState | null {
  return useContext(ComboboxContext)
}
function useComboboxContext() {
  const context = useContext(ComboboxContext)
  if (!context) throw new Error('Combobox parts must render inside Combobox.')
  return context
}
const textOf = (item?: ComboboxOption) =>
  item?.textValue ?? (typeof item?.label === 'string' ? item.label : '')
const localFilter = (item: ComboboxOption, query: string) =>
  textOf(item).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())

/** Editable search with explicit single selection. Fetching and validation messages belong to the application. */
export function Combobox({
  items,
  value,
  defaultValue,
  onValueChange,
  selectedItem,
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
  required: requiredProp,
  controlSize = 'medium',
  children
}: ComboboxProps) {
  const ids = useId()
  const field = useField()
  const disabled = !!(disabledProp || field?.disabled)
  const required = !!(requiredProp || field?.required)
  if (new Set(items.map(item => item.value)).size !== items.length)
    throw new TypeError('Combobox item values must be distinct.')
  if (
    [...items, ...(selectedItem ? [selectedItem] : [])].some(
      item => typeof item.value !== 'string' || !textOf(item).trim()
    )
  )
    throw new TypeError('Combobox items need a string value and readable textValue.')
  const selection = useControllableState({
    name: 'Combobox',
    value,
    defaultValue,
    initialValue: null,
    onChange: onValueChange
  })
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
  const currentItem =
    items.find(item => item.value === selection.value) ??
    (selectedItem?.value === selection.value ? selectedItem : undefined)
  if (currentItem && retained.get(currentItem.value) !== currentItem)
    setRetained(new Map(retained).set(currentItem.value, currentItem))
  const selected =
    currentItem ?? (selection.value === null ? undefined : retained.get(selection.value))
  const unavailable = () => disabled || !!input?.matches(':disabled')
  const isOpen = expansion.value && !disabled
  const visible =
    loading || error ? [] : filter ? items.filter(item => filter(item, search.value)) : items
  const enabled = visible.filter(item => !item.disabled)
  const activeValue = enabled.some(item => item.value === active) ? active : null
  if (active !== null && activeValue === null) highlight(null)
  const text =
    isOpen && (searching || search.value !== '')
      ? search.value
      : selected
        ? textOf(selected)
        : (selection.value ?? '')
  const setOpen = (next: boolean) => {
    if (next && unavailable()) return
    expansion.request(next)
    if (!next) highlight(null)
  }
  const dismiss = () => {
    expansion.request(false)
    highlight(null)
    setSearching(false)
    search.request('')
  }
  const setQuery = (next: string) => {
    if (unavailable()) return
    setSearching(true)
    highlight(null)
    search.request(next)
    setOpen(true)
  }
  const pending = useRef<{ value: string | null } | null>(null)
  const requestValue = (next: string | null) => {
    if (unavailable()) return
    if (next !== selection.value) pending.current = { value: next }
    selection.request(next)
    queueMicrotask(() => {
      pending.current = null
    })
  }
  const commit = (next: string | null) => {
    if (unavailable() || (next !== null && !enabled.some(item => item.value === next))) return
    const item = enabled.find(item => item.value === next)
    if (item) setRetained(previous => new Map(previous).set(item.value, item))
    requestValue(next)
    dismiss()
    input?.focus({ preventScroll: true })
  }
  const nativeValue = selection.value ?? ''
  const latest = useRef({ selection, search, nativeValue, expansion })
  useLayoutEffect(() => {
    latest.current = { selection, search, nativeValue, expansion }
  })
  useLayoutEffect(() => {
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
  }, [input, form])
  useLayoutEffect(() => {
    if (!isOpen || activeValue === null) return
    const option = content.current?.ownerDocument.getElementById(
      `${ids}-option-${encodeURIComponent(activeValue)}`
    )
    option?.scrollIntoView({ block: 'nearest' })
  }, [activeValue, isOpen, ids])
  const context: Context = {
    value: selection.value,
    query: search.value,
    open: isOpen,
    disabled,
    setValue: next => {
      if (next === null || items.some(item => item.value === next && !item.disabled))
        requestValue(next)
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
          <div
            className="relative w-full min-w-0"
            data-slot="combobox-control"
          >
            <ComboboxInput />
            <ComboboxTrigger className="absolute inset-y-0 end-0 w-12" />
          </div>
          <ComboboxPortal>
            <ComboboxContent />
          </ComboboxPortal>
        </>
      )}
      <input
        ref={bridge}
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
      required={false}
      autoComplete={props.autoComplete ?? 'off'}
      value={box.text}
      className={cn(
        comboboxInputClass,
        controlMetrics({ controlSize: box.controlSize }),
        className
      )}
      data-slot="combobox-input"
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
        if (event.key === 'Escape' && !box.open && box.value !== null) {
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
      disabled={box.disabled}
      pending={false}
      motion="off"
      controlSize={box.controlSize}
      render={resolved => {
        const native = { ...resolved, className: cn(comboboxActionClass, className) }
        return render ? render(native) : <button {...native} />
      }}
      tabIndex={-1}
      aria-label={props['aria-label'] ?? 'Show options'}
      aria-controls={box.open ? box.listId : undefined}
      aria-expanded={box.open}
      data-slot="button combobox-trigger"
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
  if (box.value === null) return null
  return (
    <Button
      variant="ghost"
      tone="neutral"
      {...props}
      type="button"
      disabled={box.disabled}
      pending={false}
      motion="off"
      controlSize={box.controlSize}
      render={resolved => {
        const native = { ...resolved, className: cn(comboboxActionClass, className) }
        return render ? render(native) : <button {...native} />
      }}
      tabIndex={-1}
      aria-label={props['aria-label'] ?? 'Clear selection'}
      data-slot="button combobox-clear"
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
      data-slot="combobox-content"
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
        aria-label={props['aria-label'] ?? box.input?.getAttribute('aria-label') ?? 'Suggestions'}
        aria-labelledby={props['aria-label'] ? undefined : box.input?.labels?.[0]?.id}
        aria-busy={box.loading || undefined}
        data-slot="combobox-listbox"
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
      aria-selected={box.active === value}
      aria-disabled={item.disabled || undefined}
      data-slot="combobox-item"
      data-value={value}
      data-highlighted={box.active === value ? '' : undefined}
      data-selected={box.value === value ? '' : undefined}
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
            className={cn(box.value !== value && 'invisible')}
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
      data-slot="combobox-status"
      className={cn('px-3 py-2 empty:hidden', className)}
    >
      {box.open ? (children ?? box.status) : null}
    </div>
  )
}

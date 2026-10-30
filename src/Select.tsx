'use client'

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- A custom select needs ARIA on its trigger/listbox/options; the native select is a separate form bridge. */

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
import { matchSelectText, moveSelectFocus, positionSelect } from './internal/select.js'
import { useComposedRefs } from './react/useComposedRefs.js'
import { useControllableState } from './react/useControllableState.js'
import { useTransitionHost } from './motion/host.js'
import type { ValueOwner } from './react/useNativeOwner.js'
import type { ControlSize } from './presentation.js'
import type { ThemeStyle } from './themes/defineTheme.js'
import { selectContentClass, selectItemClass, selectTriggerClass } from './selectStyles.js'

export type SelectOption = { value: string; disabled?: boolean } & (
  | { label: string; textValue?: string }
  | { label: ReactNode; textValue: string }
)
export type SelectProps = ValueOwner<string | null> &
  ({ open: boolean; defaultOpen?: never } | { open?: undefined; defaultOpen?: boolean }) & {
    /** One registry for native options, SSR value text and keyboard matching. Values must be unique. */
    items: readonly SelectOption[]
    onValueChange?: (value: string | null) => void
    onOpenChange?: (open: boolean) => void
    name?: string
    form?: string
    autoComplete?: string
    disabled?: boolean
    required?: boolean
    controlSize?: ControlSize
    children?: ReactNode
  }

export type SelectState = {
  value: string | null
  open: boolean
  disabled: boolean
  setValue(value: string | null): void
  setOpen(open: boolean): void
}
type Context = SelectState & {
  items: readonly SelectOption[]
  entries: { value: string; textValue: string; disabled?: boolean }[]
  controlSize: ControlSize
  required: boolean
  triggerId: string
  contentId: string
  labelId?: string
  trigger: HTMLButtonElement | null
  setTrigger(node: HTMLButtonElement | null): void
  content: RefObject<HTMLDivElement | null>
  focus(value?: string): void
  commit(value: string): void
  close(restore?: boolean): void
  search(key: string, current: string | null): string | undefined
  restoreFocus: RefObject<boolean>
}
const SelectContext = createContext<Context | null>(null)
const SelectItemContext = createContext<SelectOption | null>(null)
export function useSelect(): SelectState | null {
  return useContext(SelectContext)
}
function useSelectContext() {
  const select = useContext(SelectContext)
  if (!select) throw new Error('Select parts must render inside Select.')
  return select
}

/** Custom selection presentation with a real native form control. */
export function Select({
  items,
  value,
  defaultValue,
  onValueChange,
  open,
  defaultOpen,
  onOpenChange,
  name,
  form,
  autoComplete,
  disabled: disabledProp,
  required: requiredProp,
  controlSize = 'medium',
  children
}: SelectProps) {
  const ids = useId()
  const field = useField()
  const disabled = !!(disabledProp || field?.disabled)
  const required = !!(requiredProp || field?.required)
  const entries = items.map(item => ({
    value: item.value,
    disabled: item.disabled,
    textValue: item.textValue ?? (typeof item.label === 'string' ? item.label : '')
  }))
  if (new Set(entries.map(item => item.value)).size !== items.length)
    throw new TypeError('Select item values must be distinct.')
  if (entries.some(item => typeof item.value !== 'string' || !item.textValue.trim()))
    throw new TypeError('Select items need a string value and readable textValue.')
  const selection = useControllableState({
    name: 'Select',
    value,
    defaultValue,
    initialValue: null,
    onChange: onValueChange
  })
  const expansion = useControllableState({
    name: 'Select open',
    value: open,
    defaultValue: defaultOpen,
    initialValue: false,
    onChange: onOpenChange
  })
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null)
  const bridge = useRef<HTMLSelectElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const restoreFocus = useRef(true)
  const pendingUser = useRef<string | null>(null)
  const dispatching = useRef(false)
  const searchBuffer = useRef({ text: '', at: 0 })
  const selected = items.find(item => item.value === selection.value)
  const nativeValue = selected?.value ?? ''
  const [initialNativeValue] = useState(nativeValue)
  const isOpen = expansion.value && !disabled
  const unavailable = () => disabled || !!trigger?.matches(':disabled')
  const setOpen = (next: boolean) => {
    if (next && unavailable()) return
    searchBuffer.current = { text: '', at: 0 }
    restoreFocus.current = true
    expansion.request(next)
  }
  const close = (restore = true) => {
    restoreFocus.current = restore
    expansion.request(false)
  }
  const focus = (itemValue?: string) => {
    const nodes = content.current?.querySelectorAll<HTMLElement>('[data-slot~="select-item"]')
    const option = Array.from(nodes ?? []).find(
      node => node.dataset.value === itemValue && node.getAttribute('aria-disabled') !== 'true'
    )
    option?.focus({ preventScroll: true })
    option?.scrollIntoView({ block: 'nearest' })
  }
  const commit = (next: string) => {
    if (unavailable() || !items.some(item => item.value === next && !item.disabled)) return
    if (next !== selection.value) pendingUser.current = next
    selection.request(next)
    close()
    // A declined controlled request must not become a later programmatic change event.
    queueMicrotask(() => {
      pendingUser.current = null
    })
  }
  const latest = useRef({ selection, close, nativeValue })
  useLayoutEffect(() => {
    latest.current = { selection, close, nativeValue }
  })
  useLayoutEffect(() => {
    const node = bridge.current
    if (!node) return
    node.value = nativeValue
    if (selection.controlled)
      for (const option of node.options) option.defaultSelected = option.value === nativeValue
    if (pendingUser.current !== null && pendingUser.current === nativeValue) {
      pendingUser.current = null
      dispatching.current = true
      try {
        node.dispatchEvent(new Event('change', { bubbles: true }))
      } finally {
        dispatching.current = false
      }
    }
  })
  useEffect(() => {
    const node = bridge.current
    const owner = node?.form
    if (!owner) return
    const win = node.ownerDocument.defaultView!
    let resetTimer: number | undefined
    const reset = (event: Event) => {
      win.clearTimeout(resetTimer)
      resetTimer = win.setTimeout(() => {
        if (event.defaultPrevented || !node.isConnected) return
        latest.current.selection.reset()
        if (latest.current.selection.controlled) node.value = latest.current.nativeValue
        latest.current.close(false)
      }, 0)
    }
    owner.addEventListener('reset', reset)
    return () => {
      owner.removeEventListener('reset', reset)
      win.clearTimeout(resetTimer)
    }
  }, [form, trigger])
  useEffect(() => {
    if (
      !isOpen &&
      restoreFocus.current &&
      content.current?.contains(content.current.ownerDocument.activeElement)
    )
      trigger?.focus({ preventScroll: true })
  }, [isOpen, trigger])
  const context: Context = {
    value: selection.value,
    setValue: selection.request,
    open: isOpen,
    setOpen,
    disabled,
    items,
    entries,
    controlSize,
    required,
    triggerId: field?.controlProps?.id ?? `${ids}-trigger`,
    contentId: `${ids}-content`,
    labelId: field?.layout === 'control' ? field.labelId : undefined,
    trigger,
    setTrigger,
    content,
    focus,
    commit,
    close,
    restoreFocus,
    search(key, current) {
      const now = Date.now()
      const text = (now - searchBuffer.current.at < 1000 ? searchBuffer.current.text : '') + key
      searchBuffer.current = { text, at: now }
      return matchSelectText(entries, text, current)
    }
  }
  return (
    <SelectContext.Provider value={context}>
      {children ?? (
        <>
          <SelectTrigger>
            <SelectValue />
            <SelectIcon />
          </SelectTrigger>
          <SelectPortal>
            <SelectContent />
          </SelectPortal>
        </>
      )}
      <select
        ref={bridge}
        name={name}
        form={form}
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
        aria-hidden="true"
        tabIndex={-1}
        className="sr-only"
        data-slot="select-native"
        defaultValue={initialNativeValue}
        onFocus={() => trigger?.focus()}
        onInvalid={event => {
          event.preventDefault()
          trigger?.focus()
        }}
        onChange={event => {
          if (dispatching.current) return
          const next = event.currentTarget.value
          if (unavailable()) {
            event.currentTarget.value = latest.current.nativeValue
            return
          }
          if (items.some(item => item.value === next && !item.disabled)) selection.request(next)
          if (selection.controlled) event.currentTarget.value = nativeValue
        }}
      >
        {!items.some(item => item.value === '') && <option value="">No selection</option>}
        {items.map(item => (
          <option
            key={item.value}
            value={item.value}
            disabled={item.disabled}
          >
            {item.textValue ?? item.label}
          </option>
        ))}
      </select>
    </SelectContext.Provider>
  )
}

export type SelectTriggerProps = DistributiveOmit<
  ButtonProps,
  'variant' | 'tone' | 'type' | 'pending' | 'controlSize' | 'disabled'
>
export function SelectTrigger({
  className,
  onClick,
  onKeyDown,
  ref,
  children,
  ...props
}: SelectTriggerProps) {
  const select = useSelectContext()
  const control = useFieldControl({
    id: props.id ?? select.triggerId,
    disabled: select.disabled,
    required: select.required,
    'aria-describedby': props['aria-describedby'],
    'aria-invalid': props['aria-invalid']
  })
  const hostRef = useComposedRefs(select.setTrigger, ref)
  return (
    <Button
      {...props}
      {...control}
      ref={hostRef}
      variant="outline"
      tone="neutral"
      type="button"
      controlSize={select.controlSize}
      className={cn(
        selectTriggerClass,
        controlMetrics({ controlSize: select.controlSize }),
        className
      )}
      role="combobox"
      aria-haspopup="listbox"
      aria-controls={select.contentId}
      aria-expanded={select.open}
      aria-required={select.required || undefined}
      data-slot="button select-trigger"
      data-state={select.open ? 'open' : 'closed'}
      data-placeholder={select.value === null ? '' : undefined}
      onClick={event => {
        onClick?.(event)
        if (!event.defaultPrevented) select.setOpen(!select.open)
      }}
      onKeyDown={event => {
        onKeyDown?.(event)
        if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey) return
        if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
          event.preventDefault()
          select.setOpen(true)
        } else if (event.key.length === 1) {
          const next = select.search(event.key, select.value)
          if (next !== undefined) {
            event.preventDefault()
            select.commit(next)
          }
        }
      }}
    >
      {children ?? (
        <>
          <SelectValue />
          <SelectIcon />
        </>
      )}
    </Button>
  )
}

export type SelectValueProps = Omit<ComponentProps<'span'>, 'style'> & {
  placeholder?: ReactNode
  style?: ThemeStyle
}
export function SelectValue({
  placeholder = 'Select an option',
  children,
  className,
  ...props
}: SelectValueProps) {
  const select = useSelectContext()
  return (
    <span
      {...props}
      className={cn('min-w-0 truncate', className)}
      data-slot="select-value"
    >
      {children ?? select.items.find(item => item.value === select.value)?.label ?? placeholder}
    </span>
  )
}
export type SelectIconProps = Omit<ComponentProps<'span'>, 'style'> & { style?: ThemeStyle }
export function SelectIcon({ children, className, ...props }: SelectIconProps) {
  return (
    <span
      {...props}
      aria-hidden="true"
      data-slot="select-icon"
      className={cn('shrink-0', className)}
    >
      {children ?? (
        <svg
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
    </span>
  )
}

/** Portal into the trigger's local scope; the top layer escapes clipping and modal bounds. */
export function SelectPortal({ children }: { children?: ReactNode }) {
  const select = useSelectContext()
  return select.trigger?.parentElement ? createPortal(children, select.trigger.parentElement) : null
}

export type SelectContentProps = Omit<ComponentProps<'div'>, 'style' | 'popover'> & {
  style?: ThemeStyle
  position?: 'item-aligned' | 'popper'
  sideOffset?: number
  collisionPadding?: number
  motion?: 'inherit' | 'off'
}
export function SelectContent({
  children,
  position = 'item-aligned',
  sideOffset = 4,
  collisionPadding = 8,
  motion = 'inherit',
  className,
  onKeyDown,
  ref,
  ...props
}: SelectContentProps) {
  const select = useSelectContext()
  const mergedRef = useComposedRefs(select.content, ref)
  const {
    ref: transitionRef,
    active: motionActive,
    off: motionOff
  } = useTransitionHost('popup', mergedRef, motion === 'off')
  const latest = useRef(select)
  useLayoutEffect(() => {
    latest.current = select
  })
  const wasOpen = useRef(false)
  useLayoutEffect(() => {
    const state = latest.current
    const node = state.content.current
    const trigger = state.trigger
    if (!node || !trigger) return
    const doc = trigger.ownerDocument
    const win = doc.defaultView!
    if (!state.open) {
      if (
        wasOpen.current &&
        latest.current.restoreFocus.current &&
        node.contains(doc.activeElement)
      )
        trigger.focus({ preventScroll: true })
      if (node.matches(':popover-open')) node.hidePopover()
      wasOpen.current = false
      return
    }
    const seedWidth = () => {
      const available =
        (win.visualViewport?.width ?? win.innerWidth) - 2 * Math.max(0, collisionPadding)
      const width = `${Math.min(trigger.getBoundingClientRect().width, Math.max(0, available))}px`
      if (node.style.getPropertyValue('--_rad-select-width') !== width)
        node.style.setProperty('--_rad-select-width', width)
    }
    // Top-layer auto layout is viewport-sized. Establish the anchor width before it can paint.
    seedWidth()
    node.showPopover()
    const place = () => {
      if (!node.isConnected || !node.matches(':popover-open')) return
      seedWidth()
      const viewport = win.visualViewport
      const selected = Array.from(
        node.querySelectorAll<HTMLElement>('[data-slot~="select-item"]')
      ).find(item => item.dataset.value === latest.current.value)
      const rect = trigger.getBoundingClientRect()
      const computed = win.getComputedStyle(node)
      const viewportNode = node.querySelector<HTMLElement>('[data-slot="select-viewport"]')
      const naturalHeight = viewportNode
        ? viewportNode.scrollHeight +
          parseFloat(computed.paddingTop) +
          parseFloat(computed.paddingBottom)
        : node.scrollHeight
      const next = positionSelect({
        trigger: rect,
        width: node.getBoundingClientRect().width,
        height:
          naturalHeight +
          parseFloat(computed.borderTopWidth) +
          parseFloat(computed.borderBottomWidth),
        selectedOffset: selected ? selected.offsetTop + selected.offsetHeight / 2 : 24,
        viewport: {
          top: viewport?.offsetTop ?? 0,
          left: viewport?.offsetLeft ?? 0,
          width: viewport?.width ?? win.innerWidth,
          height: viewport?.height ?? win.innerHeight
        },
        padding: Math.max(0, collisionPadding),
        offset: sideOffset,
        aligned: position === 'item-aligned',
        rtl: win.getComputedStyle(trigger).direction === 'rtl'
      })
      for (const [key, value] of Object.entries({
        top: next.top,
        left: next.left,
        width: next.width,
        'max-height': next.maxHeight
      }))
        if (node.style.getPropertyValue(`--_rad-select-${key}`) !== `${value}px`)
          node.style.setProperty(`--_rad-select-${key}`, `${value}px`)
    }
    place()
    const active = doc.activeElement as HTMLElement | null
    if (
      !wasOpen.current ||
      active === doc.body ||
      active?.getAttribute('aria-disabled') === 'true'
    ) {
      const first =
        state.items.find(item => item.value === state.value && !item.disabled) ??
        state.items.find(item => !item.disabled)
      if (first) state.focus(first.value)
      else node.focus()
    }
    wasOpen.current = true
    const outside = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof win.Node) || node.contains(target) || trigger.contains(target)) return
      latest.current.close(false)
    }
    const focusOut = (event: FocusEvent) => {
      const target = event.target
      if (target === doc.body || target === doc.documentElement) return
      if (target instanceof win.Node && !node.contains(target) && !trigger.contains(target))
        latest.current.close(false)
    }
    const scroll = (event: Event) => {
      if (!(event.target instanceof win.Node) || !node.contains(event.target)) place()
    }
    let frame = 0
    const schedule = () => {
      if (!frame)
        frame = win.requestAnimationFrame(() => {
          frame = 0
          place()
        })
    }
    const observer = new win.ResizeObserver(schedule)
    const mutations = new win.MutationObserver(schedule)
    mutations.observe(node, { childList: true, subtree: true, characterData: true })
    observer.observe(trigger)
    observer.observe(node)
    doc.addEventListener('pointerdown', outside, true)
    doc.addEventListener('focusin', focusOut)
    doc.addEventListener('scroll', scroll, true)
    win.addEventListener('resize', place)
    win.visualViewport?.addEventListener('resize', place)
    win.visualViewport?.addEventListener('scroll', place)
    return () => {
      observer.disconnect()
      mutations.disconnect()
      win.cancelAnimationFrame(frame)
      doc.removeEventListener('pointerdown', outside, true)
      doc.removeEventListener('focusin', focusOut)
      doc.removeEventListener('scroll', scroll, true)
      win.removeEventListener('resize', place)
      win.visualViewport?.removeEventListener('resize', place)
      win.visualViewport?.removeEventListener('scroll', place)
    }
  }, [select.open, select.trigger, select.items, position, sideOffset, collisionPadding])
  useLayoutEffect(() => {
    const node = select.content.current
    const trigger = select.trigger
    return () => {
      if (node?.contains(node.ownerDocument.activeElement) && trigger?.isConnected)
        trigger.focus({ preventScroll: true })
    }
  }, [select.content, select.trigger])
  return (
    <div
      {...props}
      ref={transitionRef}
      id={select.contentId}
      popover="manual"
      role="listbox"
      tabIndex={-1}
      aria-labelledby={
        props['aria-label'] ? undefined : (select.labelId ?? select.trigger?.id ?? select.triggerId)
      }
      className={cn(
        selectContentClass,
        controlMetrics({ controlSize: select.controlSize }),
        motionActive &&
          !motionOff &&
          'opacity-[var(--_rad-popup-enter,0)] motion-reduce:opacity-100',
        className
      )}
      data-slot="select-content"
      data-state={select.open ? 'open' : 'closed'}
      data-motion={motion}
      data-position={position}
      onKeyDown={event => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          select.close()
          return
        }
        if (event.key === 'Tab') {
          event.preventDefault()
          return
        }
        if (event.ctrlKey || event.altKey || event.metaKey) return
        const target = event.target as HTMLElement
        const current =
          target.closest<HTMLElement>('[data-slot~="select-item"]')?.dataset.value ?? null
        if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
          event.preventDefault()
          select.focus(moveSelectFocus(select.entries, current, event.key))
        } else if (event.key.length === 1 && event.key !== ' ') {
          event.preventDefault()
          select.focus(select.search(event.key, current))
        }
      }}
    >
      {children ?? (
        <SelectViewport>
          {select.items.map(item => (
            <SelectItem
              key={item.value}
              value={item.value}
            >
              <SelectItemText />
              <SelectItemIndicator />
            </SelectItem>
          ))}
        </SelectViewport>
      )}
    </div>
  )
}

export type SelectViewportProps = Omit<ComponentProps<'div'>, 'style'> & { style?: ThemeStyle }
export function SelectViewport({ className, ...props }: SelectViewportProps) {
  return (
    <div
      {...props}
      data-slot="select-viewport"
      className={cn(
        'max-h-[calc(var(--_rad-select-max-height,100dvh)-0.5rem)] overflow-y-auto overscroll-contain',
        className
      )}
    />
  )
}
export type SelectItemProps = Omit<ComponentProps<'div'>, 'style'> & {
  value: string
  style?: ThemeStyle
}
export function SelectItem({
  value,
  children,
  className,
  onKeyDown,
  onClick,
  onPointerMove,
  ...props
}: SelectItemProps) {
  const select = useSelectContext()
  const item = select.items.find(item => item.value === value)
  if (!item) throw new Error('SelectItem value must exist in Select items.')
  return (
    <SelectItemContext.Provider value={item}>
      <div
        {...props}
        role="option"
        tabIndex={-1}
        aria-selected={select.value === value}
        aria-disabled={item.disabled || undefined}
        data-slot="select-item"
        data-value={value}
        data-disabled={item.disabled ? '' : undefined}
        data-state={select.value === value ? 'checked' : 'unchecked'}
        className={cn(selectItemClass, className)}
        onClick={event => {
          onClick?.(event)
          if (!event.defaultPrevented && !item.disabled) select.commit(value)
        }}
        onPointerMove={event => {
          onPointerMove?.(event)
          if (!event.defaultPrevented && event.pointerType === 'mouse' && !item.disabled)
            event.currentTarget.focus({ preventScroll: true })
        }}
        onKeyDown={event => {
          onKeyDown?.(event)
          if (!event.defaultPrevented && ['Enter', ' '].includes(event.key)) {
            event.preventDefault()
            if (!item.disabled) select.commit(value)
          }
        }}
      >
        {children ?? (
          <>
            <SelectItemText />
            <SelectItemIndicator />
          </>
        )}
      </div>
    </SelectItemContext.Provider>
  )
}
export type SelectItemTextProps = Omit<ComponentProps<'span'>, 'style'> & { style?: ThemeStyle }
export function SelectItemText({ children, className, ...props }: SelectItemTextProps) {
  const item = useContext(SelectItemContext)
  if (!item) throw new Error('SelectItemText must render inside SelectItem.')
  return (
    <span
      {...props}
      data-slot="select-item-text"
      className={cn('min-w-0 flex-1', className)}
    >
      {children ?? item.label}
    </span>
  )
}
export function SelectItemIndicator({ children, className, ...props }: SelectIconProps) {
  const select = useSelectContext()
  const item = useContext(SelectItemContext)
  if (!item) throw new Error('SelectItemIndicator must render inside SelectItem.')
  return (
    <span
      {...props}
      data-slot="select-item-indicator"
      aria-hidden="true"
      className={cn('shrink-0', select.value !== item.value && 'invisible', className)}
    >
      {children ?? '✓'}
    </span>
  )
}
export type SelectGroupProps = Omit<ComponentProps<'div'>, 'style'> & {
  label: ReactNode
  style?: ThemeStyle
}
export function SelectGroup({ label, children, className, ...props }: SelectGroupProps) {
  const id = useId()
  return (
    <div
      {...props}
      role="group"
      aria-labelledby={id}
      data-slot="select-group"
      className={className}
    >
      <div
        id={id}
        data-slot="select-label"
        className="px-3 py-2 text-sm font-semibold"
      >
        {label}
      </div>
      {children}
    </div>
  )
}

'use client'

import {
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  type ComponentProps
} from 'react'
import { Button, type ButtonProps, type ButtonRenderProps } from './Button.js'
import { cn } from './cn.js'
import { controlMetrics } from './controlStyles.js'
import { composeAction } from './internal/events.js'
import { joinIds } from './internal/ids.js'
import { useComposedRefs } from './react/useComposedRefs.js'
import { useControllableState } from './react/useControllableState.js'
import type { ControlSize, Orientation } from './presentation.js'
import type { ValueOwner } from './react/useNativeOwner.js'
import type { ThemeStyle } from './themes/defineTheme.js'

const rootClass =
  'grid min-w-0 gap-[var(--rad-tabs-gap,var(--rad-spacing-group-gap,0.75rem))] data-[orientation=vertical]:grid-cols-[max-content_minmax(0,1fr)] data-[orientation=vertical]:items-start'
const listClass =
  'inline-flex min-w-0 max-w-full gap-[var(--rad-tabs-list-gap,0.25rem)] rounded-[var(--rad-tabs-list-radius,var(--rad-control-radius,0.5rem))] bg-[var(--rad-tabs-list-background,var(--rad-color-neutral,oklch(0.955_0.004_286)))] p-[var(--rad-tabs-list-padding,0.25rem)] data-[orientation=horizontal]:flex-row data-[orientation=horizontal]:overflow-x-auto data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch'
const triggerClass = [
  'box-border inline-flex min-w-0 shrink-0 cursor-pointer select-none items-center justify-center border-solid text-center',
  'min-h-[var(--rad-tabs-trigger-height,var(--_rad-control-height))]',
  'px-[var(--rad-tabs-trigger-padding,var(--_rad-control-padding))]',
  'rounded-[var(--rad-tabs-trigger-radius,var(--rad-control-radius,0.5rem))]',
  '[corner-shape:var(--rad-tabs-corner-shape,var(--rad-control-corner-shape,round))]',
  '[border-width:var(--rad-tabs-trigger-border-width,var(--rad-control-border-width,1px))]',
  '[border-color:transparent]',
  'font-[family-name:var(--rad-tabs-font-family,var(--rad-typography-roles-ui-label-family,system-ui,sans-serif))]',
  'font-[number:var(--rad-tabs-font-weight,var(--rad-typography-roles-ui-label-weight,550))]',
  'text-[length:var(--rad-tabs-font-size,var(--_rad-control-font-size))]',
  'tracking-[var(--rad-typography-roles-ui-label-letter-spacing,-0.011em)] leading-[var(--rad-typography-roles-ui-label-line-height,1.4)]',
  '[color:var(--rad-tabs-trigger-color,var(--rad-color-muted-foreground,oklch(0.45_0.01_286)))]',
  'bg-[var(--rad-tabs-trigger-background,transparent)]',
  'hover:bg-[var(--rad-tabs-trigger-hover-background,var(--rad-color-surface,oklch(1_0_0)))]',
  'data-selected:bg-[var(--rad-tabs-trigger-active-background,var(--rad-color-surface,oklch(1_0_0)))]',
  'data-selected:[color:var(--rad-tabs-trigger-active-color,var(--rad-color-foreground,oklch(0.21_0.006_286)))]',
  'data-selected:[border-color:var(--rad-tabs-trigger-active-border,var(--rad-color-accent,oklch(0.21_0.006_286)))]',
  'focus-visible:outline-solid',
  'focus-visible:[outline-color:var(--rad-tabs-focus-color,var(--rad-color-focus,oklch(0.55_0.13_255)))]',
  'focus-visible:[outline-width:var(--rad-tabs-focus-width,var(--rad-focus-width,2px))]',
  'focus-visible:[outline-offset:var(--rad-tabs-focus-offset,var(--rad-focus-offset,2px))]',
  'focus-visible:[outline-style:var(--rad-tabs-focus-style,var(--rad-focus-style,solid))]',
  'disabled:cursor-not-allowed disabled:opacity-[var(--rad-tabs-disabled-opacity,var(--rad-state-disabled-opacity,0.5))]',
  'disabled:bg-[var(--rad-tabs-trigger-background,transparent)]',
  'forced-colors:border-[ButtonText] forced-colors:text-[ButtonText]',
  'forced-colors:data-selected:border-[Highlight] forced-colors:data-selected:text-[Highlight]',
  'forced-colors:disabled:text-[GrayText] forced-colors:disabled:border-[GrayText] forced-colors:disabled:opacity-100'
].join(' ')
const contentClass =
  'min-w-0 rounded-[var(--rad-tabs-content-radius,var(--rad-control-radius,0.5rem))] p-[var(--rad-tabs-content-padding,1rem)] [color:var(--rad-tabs-content-color,var(--rad-color-foreground,oklch(0.21_0.006_286)))] bg-[var(--rad-tabs-content-background,var(--rad-color-surface,oklch(1_0_0)))] font-[family-name:var(--rad-typography-roles-ui-body-family,system-ui,sans-serif)] text-[length:var(--rad-typography-roles-ui-body-size,0.875rem)] leading-[var(--rad-typography-roles-ui-body-line-height,1.5)] focus-visible:outline-solid focus-visible:[outline-color:var(--rad-tabs-focus-color,var(--rad-color-focus,oklch(0.55_0.13_255)))] focus-visible:[outline-width:var(--rad-tabs-focus-width,var(--rad-focus-width,2px))] focus-visible:[outline-offset:var(--rad-tabs-focus-offset,var(--rad-focus-offset,2px))] focus-visible:[outline-style:var(--rad-tabs-focus-style,var(--rad-focus-style,solid))]'

type SelectionOwner = ValueOwner<string> & ({ value: string } | { defaultValue: string })

export type TabsProps = Omit<ComponentProps<'div'>, 'defaultValue' | 'onChange' | 'style'> &
  SelectionOwner & {
    onValueChange?: (value: string) => void
    orientation?: Orientation
    activationMode?: 'automatic' | 'manual'
    loop?: boolean
    disabled?: boolean
    controlSize?: ControlSize
    style?: ThemeStyle
    'data-slot'?: string
  }
export type TabsListProps = Omit<
  ComponentProps<'div'>,
  'role' | 'aria-orientation' | 'tabIndex' | 'style'
> & {
  style?: ThemeStyle
  'data-slot'?: string
}
export type TabsTriggerProps = Omit<
  ButtonProps,
  | 'value'
  | 'type'
  | 'role'
  | 'id'
  | 'tabIndex'
  | 'aria-selected'
  | 'aria-controls'
  | 'aria-disabled'
  | 'variant'
  | 'tone'
  | 'iconOnly'
  | 'fullWidth'
  | 'pending'
  | 'motion'
  | 'pressed'
  | 'defaultPressed'
  | 'onPressedChange'
> & { value: string }
export type TabsRenderProps = ButtonRenderProps
export type TabsContentProps = Omit<
  ComponentProps<'div'>,
  'id' | 'role' | 'aria-labelledby' | 'aria-hidden' | 'hidden' | 'inert' | 'style'
> & {
  value: string
  /** Preserve inactive children and their local state; the panel stays hidden. */
  keepMounted?: boolean
  style?: ThemeStyle
  'data-slot'?: string
}
export type TabsState = {
  value: string
  setValue: (value: string) => void
  controlled: boolean
  orientation: Orientation
  activationMode: 'automatic' | 'manual'
  loop: boolean
  disabled: boolean
  controlSize: ControlSize
}

const TabsContext = createContext<{ state: TabsState; id: string } | null>(null)
const TabsListContext = createContext(false)

export function useTabs(): TabsState | null {
  return useContext(TabsContext)?.state ?? null
}
function useTabsContext() {
  const tabs = useContext(TabsContext)
  if (!tabs) throw new Error('Tabs parts must render inside Tabs.')
  return tabs
}
function checkValue(value: unknown) {
  if (typeof value !== 'string') throw new TypeError('Tabs values must be strings.')
}
function tabId(id: string, value: string) {
  return `${id}-tab-${encodeURIComponent(value)}`
}
function panelId(id: string, value: string) {
  return `${id}-panel-${encodeURIComponent(value)}`
}

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  orientation = 'horizontal',
  activationMode = 'automatic',
  loop = true,
  disabled = false,
  controlSize = 'medium',
  className,
  children,
  id,
  ...props
}: TabsProps) {
  const generatedId = useId()
  const {
    value: selected,
    request,
    controlled
  } = useControllableState({
    name: 'Tabs',
    value,
    defaultValue,
    initialValue: '',
    onChange: onValueChange
  })
  if (value === undefined && defaultValue === undefined)
    throw new TypeError('Tabs requires value or defaultValue to select an initial tab.')
  checkValue(selected)
  const state: TabsState = {
    value: selected,
    controlled,
    orientation,
    activationMode,
    loop,
    disabled,
    controlSize,
    setValue(next) {
      if (!disabled) {
        checkValue(next)
        request(next)
      }
    }
  }
  return (
    <TabsContext.Provider value={{ state, id: id ?? generatedId }}>
      <TabsListContext.Provider value={false}>
        <div
          {...props}
          id={id ?? generatedId}
          className={cn(rootClass, className)}
          data-slot={joinIds('tabs', props['data-slot'])}
          data-control-size={controlSize}
          data-orientation={orientation}
          data-disabled={disabled ? '' : undefined}
        >
          {children}
        </div>
      </TabsListContext.Provider>
    </TabsContext.Provider>
  )
}

function triggers(list: HTMLDivElement) {
  return Array.from(list.querySelectorAll<HTMLButtonElement>('[role=tab]')).filter(
    tab => tab.closest('[role=tablist]') === list
  )
}
function enabledTriggers(list: HTMLDivElement) {
  const visible = list.getClientRects().length > 0
  return triggers(list).filter(
    tab =>
      !tab.matches(':disabled') &&
      tab.getAttribute('aria-disabled') !== 'true' &&
      (!visible || tab.getClientRects().length > 0)
  )
}
function syncTabStops(list: HTMLDivElement, value: string, preferFocus = true) {
  const all = triggers(list)
  const enabled = enabledTriggers(list)
  const entry =
    (preferFocus && enabled.find(tab => tab === list.ownerDocument.activeElement)) ||
    enabled.find(tab => tab.dataset.value === value) ||
    enabled[0] ||
    all.find(tab => tab.dataset.value === value && !tab.disabled)
  for (const tab of all) {
    const index = tab === entry ? 0 : -1
    if (tab.tabIndex !== index) tab.tabIndex = index
  }
}

export function TabsList({ ref, className, onFocus, onBlur, onKeyDown, ...props }: TabsListProps) {
  const { state: tabs } = useTabsContext()
  const listRef = useRef<HTMLDivElement>(null)
  const hostRef = useComposedRefs(listRef, ref)
  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const sync = () => syncTabStops(list, tabs.value)
    sync()
    const Observer = list.ownerDocument.defaultView?.MutationObserver
    const observer = Observer ? new Observer(sync) : undefined
    observer?.observe(list, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [
        'disabled',
        'aria-disabled',
        'hidden',
        'class',
        'style',
        'tabindex',
        'data-value'
      ]
    })
    return () => observer?.disconnect()
  }, [tabs.value, tabs.disabled])
  return (
    <TabsListContext.Provider value={true}>
      <div
        {...props}
        ref={hostRef}
        role="tablist"
        tabIndex={undefined}
        aria-orientation={tabs.orientation}
        className={cn(listClass, className)}
        data-slot={joinIds('tabs-list', props['data-slot'])}
        data-orientation={tabs.orientation}
        onFocus={event => {
          onFocus?.(event)
          syncTabStops(event.currentTarget, tabs.value)
        }}
        onBlur={event => {
          onBlur?.(event)
          if (!event.currentTarget.contains(event.relatedTarget))
            syncTabStops(event.currentTarget, tabs.value, false)
        }}
        onKeyDown={composeAction(
          onKeyDown,
          event => {
            if (event.altKey || event.ctrlKey || event.metaKey) return
            const list = event.currentTarget
            const current = (event.target as Element).closest('[role=tab]')
            const items = enabledTriggers(list)
            const index = items.findIndex(tab => tab === current)
            if (index < 0) return
            const rtl = list.ownerDocument.defaultView?.getComputedStyle(list).direction === 'rtl'
            let next: number
            if (event.key === 'Home') next = 0
            else if (event.key === 'End') next = items.length - 1
            else {
              const forward =
                tabs.orientation === 'vertical' ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight'
              const backward =
                tabs.orientation === 'vertical' ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft'
              if (event.key !== forward && event.key !== backward) return
              next = index + (event.key === forward ? 1 : -1)
              next = tabs.loop
                ? (next + items.length) % items.length
                : Math.max(0, Math.min(items.length - 1, next))
            }
            event.preventDefault()
            items[next]?.focus()
          },
          () => tabs.disabled
        )}
      />
    </TabsListContext.Provider>
  )
}

export function TabsTrigger({
  value,
  disabled = false,
  controlSize,
  className,
  onClick,
  onFocus,
  onBlur,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onPointerLeave,
  render,
  ...props
}: TabsTriggerProps) {
  const { state: tabs, id } = useTabsContext()
  const inList = useContext(TabsListContext)
  const pointerFocus = useRef(false)
  if (!inList) throw new Error('TabsTrigger must render inside TabsList.')
  checkValue(value)
  const selected = tabs.value === value
  const unavailable = disabled || tabs.disabled
  return (
    <Button
      {...props}
      disabled={unavailable}
      type="button"
      role="tab"
      id={tabId(id, value)}
      aria-selected={selected}
      aria-controls={panelId(id, value)}
      aria-disabled={unavailable || undefined}
      tabIndex={selected && !unavailable ? 0 : -1}
      data-value={value}
      data-selected={selected ? '' : undefined}
      data-disabled={unavailable ? '' : undefined}
      data-slot={joinIds('tabs-trigger', props['data-slot'])}
      data-orientation={tabs.orientation}
      motion="off"
      pending={false}
      pressed={undefined}
      defaultPressed={undefined}
      onPressedChange={undefined}
      variant="ghost"
      tone="neutral"
      controlSize={controlSize ?? tabs.controlSize}
      onPointerDown={event => {
        onPointerDown?.(event)
        pointerFocus.current = !event.defaultPrevented
      }}
      onPointerUp={event => {
        pointerFocus.current = false
        onPointerUp?.(event)
      }}
      onPointerCancel={event => {
        pointerFocus.current = false
        onPointerCancel?.(event)
      }}
      onPointerLeave={event => {
        pointerFocus.current = false
        onPointerLeave?.(event)
      }}
      onBlur={event => {
        pointerFocus.current = false
        onBlur?.(event)
      }}
      onClick={event => {
        pointerFocus.current = false
        if (unavailable) {
          event.preventDefault()
          return
        }
        onClick?.(event)
        if (!event.defaultPrevented) tabs.setValue(value)
      }}
      onFocus={event => {
        const pointer = pointerFocus.current
        pointerFocus.current = false
        if (unavailable) return
        onFocus?.(event)
        if (!event.defaultPrevented && !pointer && tabs.activationMode === 'automatic')
          tabs.setValue(value)
      }}
      render={resolved => {
        const tabProps = {
          ...resolved,
          className: cn(
            triggerClass,
            controlMetrics({ controlSize: controlSize ?? tabs.controlSize }),
            className
          )
        }
        return render ? render(tabProps) : <button {...tabProps}>{tabProps.children}</button>
      }}
    />
  )
}

export function TabsContent({
  value,
  keepMounted = false,
  className,
  children,
  style,
  tabIndex = 0,
  ...props
}: TabsContentProps) {
  const { state: tabs, id } = useTabsContext()
  checkValue(value)
  const selected = tabs.value === value
  return (
    <div
      {...props}
      role="tabpanel"
      id={panelId(id, value)}
      aria-labelledby={tabId(id, value)}
      hidden={!selected}
      inert={!selected || undefined}
      aria-hidden={!selected || undefined}
      tabIndex={selected ? tabIndex : -1}
      className={cn(contentClass, className)}
      style={{ ...style, display: selected ? style?.display : 'none' }}
      data-slot={joinIds('tabs-content', props['data-slot'])}
      data-value={value}
      data-orientation={tabs.orientation}
    >
      {selected || keepMounted ? children : null}
    </div>
  )
}

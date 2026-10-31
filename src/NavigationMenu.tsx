'use client'

/* oxlint-disable jsx-a11y/no-noninteractive-element-interactions -- Navigation delegates Escape for real buttons and links; the landmark remains navigation rather than a menu widget. */

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type RefObject
} from 'react'
import { Button, type ButtonProps, type ButtonRenderProps } from './Button.js'
import {
  ComposedLink,
  type ComposedLinkProps,
  type ComposedLinkRenderProps
} from './composedLink.js'
import { cn } from './cn.js'
import { ScrollArea } from './ScrollArea.js'
import { composeAction } from './internal/events.js'
import { joinIds } from './internal/ids.js'
import { requireAccessibleName, type AccessibleName } from './internal/accessibleName.js'
import type { DistributiveOmit, WithoutToggle } from './internal/types.js'
import { useControllableState } from './react/useControllableState.js'
import { useComposedRefs } from './react/useComposedRefs.js'
import { useHoverSurface } from './react/useHoverSurface.js'
import type { ValueOwner } from './react/useNativeOwner.js'
import { useTransitionHost } from './motion/host.js'
import type { ControlSize } from './presentation.js'
import type { ThemeStyle } from './themes/defineTheme.js'

export type NavigationMenuItemConfig = { value: string; disabled?: boolean }
export type NavigationMenuProps = Omit<
  ComponentProps<'nav'>,
  'style' | 'role' | 'onChange' | 'defaultValue'
> &
  AccessibleName &
  ValueOwner<string | null> & {
    style?: ThemeStyle
    'data-slot'?: string
    items: readonly NavigationMenuItemConfig[]
    onValueChange?: (value: string | null) => void
    openDelay?: number
    closeDelay?: number
    disabled?: boolean
    controlSize?: ControlSize
  }
export type NavigationMenuState = {
  value: string | null
  controlled: boolean
  disabled: boolean
  setValue: (value: string | null) => void
}
type Hover = ReturnType<typeof useHoverSurface>
type Binding = NavigationMenuState & {
  visible: string | null
  items: readonly NavigationMenuItemConfig[]
  controlSize: ControlSize
  openDelay: number
  closeDelay: number
  root: RefObject<HTMLElement | null>
  viewport: RefObject<HTMLDivElement | null>
  triggers: RefObject<Map<string, HTMLButtonElement>>
  panels: RefObject<Map<string, HTMLDivElement>>
  hover: RefObject<Map<string, Hover>>
  ids: (value: string) => { trigger: string; panel: string }
  requestFocus: (value: string, last: boolean) => void
  cancel: () => void
  registerTrigger: (value: string, node: HTMLButtonElement | null) => void
  registerPanel: (value: string, node: HTMLDivElement | null) => void
}
const Context = createContext<Binding | null>(null)
export function useNavigationMenu(): NavigationMenuState | null {
  return useContext(Context)
}
function useBinding() {
  const value = useContext(Context)
  if (!value) throw new Error('NavigationMenu parts must render inside NavigationMenu.')
  return value
}
function item(binding: Binding, value: string) {
  const entry = binding.items.find(entry => entry.value === value)
  if (!entry) throw new TypeError('NavigationMenu parts require a registered value.')
  return entry
}
function focusable(panel: HTMLElement) {
  return Array.from(
    panel.querySelectorAll<HTMLElement>('a[href],button,input,select,textarea,[tabindex]')
  ).filter(
    node =>
      node.tabIndex >= 0 &&
      !node.matches(':disabled') &&
      !node.closest('[inert]') &&
      node.getClientRects().length > 0
  )
}
export function NavigationMenu({
  items,
  value,
  defaultValue,
  onValueChange,
  openDelay = 200,
  closeDelay = 150,
  disabled = false,
  controlSize = 'medium',
  ref,
  className,
  onKeyDown,
  onBlurCapture,
  onFocusCapture,
  ...props
}: NavigationMenuProps) {
  requireAccessibleName('NavigationMenu', props)
  if (
    !Array.isArray(items) ||
    items.some(
      entry =>
        typeof entry.value !== 'string' ||
        !entry.value ||
        (entry.disabled !== undefined && typeof entry.disabled !== 'boolean')
    ) ||
    new Set(items.map(entry => entry.value)).size !== items.length
  )
    throw new TypeError('NavigationMenu items require unique nonempty values.')
  if (![openDelay, closeDelay].every(n => Number.isFinite(n) && n >= 0))
    throw new TypeError('NavigationMenu delays must be finite and nonnegative.')
  const state = useControllableState<string | null>({
    name: 'NavigationMenu',
    value,
    defaultValue,
    initialValue: null,
    onChange: onValueChange
  })
  const valid = (next: string | null) => {
    if (next !== null && !items.some(entry => entry.value === next))
      throw new TypeError('NavigationMenu value must identify a registered panel.')
  }
  valid(state.value)
  const shown =
    !disabled && state.value !== null && !items.find(entry => entry.value === state.value)?.disabled
      ? state.value
      : null
  const root = useRef<HTMLElement>(null),
    viewport = useRef<HTMLDivElement>(null),
    triggers = useRef(new Map<string, HTMLButtonElement>()),
    panels = useRef(new Map<string, HTMLDivElement>()),
    hover = useRef(new Map<string, Hover>()),
    id = useId(),
    latest = useRef(shown),
    pending = useRef<{ value: string; last: boolean } | null>(null),
    focusedPanel = useRef<string | null>(null),
    previous = useRef(shown)
  useLayoutEffect(() => {
    latest.current = shown
  })
  const registerTrigger = useCallback((value: string, node: HTMLButtonElement | null) => {
    if (node) triggers.current.set(value, node)
    else triggers.current.delete(value)
  }, [])
  const registerPanel = useCallback((value: string, node: HTMLDivElement | null) => {
    if (node) panels.current.set(value, node)
    else panels.current.delete(value)
  }, [])
  const host = useComposedRefs(root, ref)
  const cancel = () => hover.current.forEach(binding => binding.cancel())
  const setValue = (next: string | null) => {
    valid(next)
    cancel()
    if (disabled || (next !== null && items.find(entry => entry.value === next)?.disabled)) return
    state.request(next)
  }
  const requestFocus = (next: string, last: boolean) => {
    pending.current = { value: next, last }
    setValue(next)
    root.current?.ownerDocument.defaultView?.queueMicrotask(() => {
      const intent = pending.current
      if (!intent || intent.value !== next) return
      pending.current = null
      if (latest.current !== next) return
      const panel = panels.current.get(next),
        nodes = panel ? focusable(panel) : []
      ;(last ? nodes.at(-1) : nodes[0])?.focus()
    })
  }
  useLayoutEffect(() => {
    const node = root.current
    if (!node) return
    const doc = node.ownerDocument
    const close = (event: Event) => {
      if (!event.defaultPrevented && !event.composedPath().includes(node)) setValue(null)
    }
    doc.addEventListener('pointerdown', close)
    doc.addEventListener('focusin', close)
    doc.defaultView?.addEventListener('blur', close)
    return () => {
      doc.removeEventListener('pointerdown', close)
      doc.removeEventListener('focusin', close)
      doc.defaultView?.removeEventListener('blur', close)
    }
  })
  useLayoutEffect(() => {
    if (previous.current !== shown) {
      const old = previous.current,
        doc = root.current?.ownerDocument,
        active = doc?.activeElement
      if (
        old !== null &&
        focusedPanel.current === old &&
        doc &&
        (active === doc.body || root.current?.contains(active ?? null))
      )
        (triggers.current.get(old)?.disabled
          ? focusable(root.current!)[0]
          : triggers.current.get(old)
        )?.focus()
      focusedPanel.current = null
    }
    previous.current = shown
  })
  return (
    <Context.Provider
      value={{
        visible: shown,
        value: state.value,
        controlled: state.controlled,
        disabled,
        setValue,
        items,
        controlSize,
        openDelay,
        closeDelay,
        root,
        viewport,
        triggers,
        panels,
        hover,
        cancel,
        requestFocus,
        registerTrigger,
        registerPanel,
        ids: next => ({
          trigger: `${id}-trigger-${items.findIndex(entry => entry.value === next)}`,
          panel: `${id}-panel-${items.findIndex(entry => entry.value === next)}`
        })
      }}
    >
      <nav
        {...props}
        ref={host}
        {...{ role: undefined }}
        data-slot={joinIds('navigation-menu', props['data-slot'])}
        data-state={shown !== null ? 'open' : 'closed'}
        data-disabled={disabled || undefined}
        data-control-size={controlSize}
        className={cn('relative max-w-full', className)}
        onKeyDown={event => {
          onKeyDown?.(event)
          if (event.defaultPrevented) return
          if (
            event.key === 'Escape' &&
            state.value !== null &&
            event.target instanceof root.current!.ownerDocument.defaultView!.HTMLElement &&
            event.target.closest('[data-slot~="navigation-menu"]') === root.current
          ) {
            event.preventDefault()
            focusedPanel.current = state.value
            setValue(null)
          }
        }}
        onFocusCapture={event => {
          onFocusCapture?.(event)
          focusedPanel.current = viewport.current?.contains(event.target) ? shown : null
        }}
        onBlurCapture={event => {
          onBlurCapture?.(event)
          if (!event.currentTarget.contains(event.relatedTarget)) {
            cancel()
          }
        }}
      >
        {props.children}
      </nav>
    </Context.Provider>
  )
}
export type NavigationMenuListProps = Omit<ComponentProps<'ul'>, 'style' | 'role'> & {
  style?: ThemeStyle
  'data-slot'?: string
}
export function NavigationMenuList({ className, ...props }: NavigationMenuListProps) {
  useBinding()
  return (
    <ul
      {...props}
      {...{ role: undefined }}
      data-slot={joinIds('navigation-menu-list', props['data-slot'])}
      className={cn(
        'm-0 flex flex-wrap list-none items-center gap-[var(--rad-navigation-menu-gap,0.25rem)] p-0',
        className
      )}
    />
  )
}
export type NavigationMenuItemProps = Omit<ComponentProps<'li'>, 'style' | 'role'> & {
  style?: ThemeStyle
  'data-slot'?: string
}
export function NavigationMenuItem(props: NavigationMenuItemProps) {
  useBinding()
  return (
    <li
      {...props}
      {...{ role: undefined }}
      data-slot={joinIds('navigation-menu-item', props['data-slot'])}
    />
  )
}
export type NavigationMenuRenderProps = ButtonRenderProps
export type NavigationMenuLinkRenderProps = ComposedLinkRenderProps
export type NavigationMenuTriggerProps = WithoutToggle<
  DistributiveOmit<
    ButtonProps,
    | 'value'
    | 'aria-expanded'
    | 'aria-controls'
    | 'aria-haspopup'
    | 'id'
    | 'role'
    | 'popoverTarget'
    | 'popoverTargetAction'
  >
> & { value: string }
export function NavigationMenuTrigger({
  value,
  ref,
  onClick,
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  onKeyDown,
  onFocus,
  onBlur,
  disabled,
  controlSize,
  variant = 'ghost',
  tone = 'neutral',
  ...props
}: NavigationMenuTriggerProps) {
  const binding = useBinding(),
    entry = item(binding, value),
    registerTrigger = binding.registerTrigger,
    [node, setNode] = useState<HTMLButtonElement | null>(null),
    register = useCallback(
      (element: HTMLButtonElement | null) => {
        setNode(element)
        registerTrigger(value, element)
      },
      [registerTrigger, value, setNode]
    ),
    host = useComposedRefs(register, ref),
    open = binding.visible === value,
    blocked = binding.disabled || entry.disabled || disabled || props.pending
  const hover = useHoverSurface({
    trigger: node,
    content: binding.viewport,
    open,
    request: next => {
      if (next) binding.setValue(value)
      else if (binding.value === value) binding.setValue(null)
    },
    openDelay: binding.value === null ? binding.openDelay : 0,
    closeDelay: binding.closeDelay
  })
  useLayoutEffect(() => {
    const hovers = binding.hover.current
    hovers.set(value, hover)
    if (!open) hover.cancel(true)
    return () => {
      hovers.delete(value)
    }
  })
  return (
    <Button
      {...props}
      ref={host}
      disabled={binding.disabled || entry.disabled || disabled}
      controlSize={controlSize ?? binding.controlSize}
      variant={variant}
      tone={tone}
      pressed={undefined}
      defaultPressed={undefined}
      onPressedChange={undefined}
      aria-pressed={undefined}
      aria-haspopup={undefined}
      popoverTarget={undefined}
      popoverTargetAction={undefined}
      {...{ role: undefined }}
      id={binding.ids(value).trigger}
      aria-expanded={open}
      aria-controls={binding.ids(value).panel}
      data-slot={joinIds('navigation-menu-trigger', props['data-slot'])}
      data-state={open ? 'open' : 'closed'}
      onClick={composeAction(onClick, () => binding.setValue(open ? null : value))}
      onPointerDown={composeAction(onPointerDown, binding.cancel)}
      onPointerEnter={composeAction(onPointerEnter, event => {
        if (!blocked && event.pointerType !== 'touch') hover.enter()
      })}
      onPointerLeave={composeAction(onPointerLeave, event => {
        if (event.pointerType !== 'touch') hover.leave()
      })}
      onFocus={event => {
        onFocus?.(event)
        if (open) hover.enter(true)
      }}
      onBlur={event => {
        onBlur?.(event)
        hover.leave(true)
      }}
      onKeyDown={composeAction(onKeyDown, event => {
        if (blocked || event.altKey || event.metaKey || event.ctrlKey) return
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault()
          binding.requestFocus(value, event.key === 'ArrowUp')
          return
        }
        const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
        if (!keys.includes(event.key)) return
        const nodes = binding.items
          .map(entry => binding.triggers.current.get(entry.value))
          .filter(
            (button): button is HTMLButtonElement =>
              !!button && !button.disabled && button.getAttribute('aria-busy') !== 'true'
          )
        const current = nodes.indexOf(event.currentTarget)
        if (current < 0) return
        const rtl = node?.ownerDocument.defaultView?.getComputedStyle(node).direction === 'rtl',
          delta = (event.key === 'ArrowRight' ? 1 : -1) * (rtl ? -1 : 1)
        const next =
          event.key === 'Home'
            ? nodes[0]
            : event.key === 'End'
              ? nodes.at(-1)
              : nodes[(current + delta + nodes.length) % nodes.length]
        event.preventDefault()
        next?.focus()
      })}
    />
  )
}
export type NavigationMenuLinkProps = Omit<ComposedLinkProps, 'aria-current'> & { active?: boolean }
export function NavigationMenuLink({
  active = false,
  onClick,
  controlSize,
  variant = 'subtle',
  ...props
}: NavigationMenuLinkProps) {
  const binding = useBinding()
  return (
    <ComposedLink
      {...props}
      identity="navigation-menu-link"
      variant={variant}
      controlSize={controlSize ?? binding.controlSize}
      aria-current={active ? 'page' : undefined}
      onClick={composeAction(onClick, event => {
        if (
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        )
          binding.setValue(null)
      })}
    />
  )
}
export type NavigationMenuContentProps = Omit<
  ComponentProps<'div'>,
  'style' | 'role' | 'id' | 'hidden' | 'inert' | 'aria-labelledby'
> & { style?: ThemeStyle; value: string; 'data-slot'?: string }
export function NavigationMenuContent({
  value,
  ref,
  className,
  ...props
}: NavigationMenuContentProps) {
  const binding = useBinding()
  const registerPanel = binding.registerPanel
  item(binding, value)
  const register = useCallback(
      (node: HTMLDivElement | null) => {
        registerPanel(value, node)
      },
      [registerPanel, value]
    ),
    host = useComposedRefs(register, ref),
    open = binding.visible === value
  return (
    <div
      {...props}
      ref={host}
      id={binding.ids(value).panel}
      {...{ 'aria-labelledby': undefined }}
      hidden={!open}
      inert={!open}
      data-slot={joinIds('navigation-menu-content', props['data-slot'])}
      data-state={open ? 'open' : 'closed'}
      className={cn(
        'box-border w-max max-w-[var(--_rad-navigation-menu-room,100vw)] p-[var(--rad-navigation-menu-padding,1rem)] [overflow-wrap:anywhere] [hidden]:hidden',
        className
      )}
    />
  )
}
export type NavigationMenuViewportProps = Omit<
  ComponentProps<'div'>,
  | 'style'
  | 'hidden'
  | 'inert'
  | 'role'
  | 'aria-label'
  | 'aria-labelledby'
  | 'contentEditable'
  | 'dangerouslySetInnerHTML'
> & { style?: ThemeStyle; motion?: 'inherit' | 'off'; sideOffset?: number; 'data-slot'?: string }
export function NavigationMenuViewport({
  ref,
  className,
  motion = 'inherit',
  sideOffset = 8,
  onPointerEnter,
  onPointerLeave,
  onFocusCapture,
  onBlurCapture,
  ...props
}: NavigationMenuViewportProps) {
  const binding = useBinding(),
    node = useRef<HTMLDivElement>(null),
    localHost = useComposedRefs(node, ref),
    host = useComposedRefs(binding.viewport, localHost),
    { ref: motionRef } = useTransitionHost('indicator', host, motion === 'off'),
    open = binding.visible !== null
  if (!Number.isFinite(sideOffset) || sideOffset < 0)
    throw new TypeError('NavigationMenu sideOffset must be finite and nonnegative.')
  useLayoutEffect(() => {
    const viewport = node.current,
      root =
        binding.root.current ?? viewport?.closest<HTMLElement>('[data-slot~="navigation-menu"]')
    if (!viewport || !root) return
    const view = root.ownerDocument.defaultView!,
      panel = binding.visible === null ? undefined : binding.panels.current.get(binding.visible),
      trigger = binding.visible === null ? undefined : binding.triggers.current.get(binding.visible)
    if (!open || !panel || !trigger) {
      viewport.removeAttribute('data-rad-indicator-target')
      return
    }
    const measure = () => {
      const border = view.getComputedStyle(viewport),
        inlineBorder = parseFloat(border.borderLeftWidth) + parseFloat(border.borderRightWidth),
        blockBorder = parseFloat(border.borderTopWidth) + parseFloat(border.borderBottomWidth)
      viewport.style.setProperty(
        '--_rad-navigation-menu-room',
        `${Math.max(0, root.clientWidth - inlineBorder - 24)}px`
      )
      const width = panel.offsetWidth + inlineBorder + 24,
        height = panel.offsetHeight + blockBorder + 24,
        rect = root.getBoundingClientRect(),
        anchor = trigger.getBoundingClientRect(),
        scale = root.offsetWidth ? rect.width / root.offsetWidth : 1,
        rtl = view.getComputedStyle(root).direction === 'rtl'
      const start =
        (rtl ? anchor.right - rect.left : anchor.left - rect.left) / scale -
        root.clientLeft -
        (rtl ? width : 0)
      const target = [
        Math.max(0, Math.min(root.clientWidth - width, start)),
        sideOffset,
        width,
        height
      ]
      for (const [index, axis] of ['x', 'y', 'width', 'height'].entries())
        viewport.style.setProperty(`--_rad-indicator-target-${axis}`, `${target[index]}px`)
      const serialized = JSON.stringify(target)
      if (viewport.getAttribute('data-rad-indicator-target') !== serialized)
        viewport.setAttribute('data-rad-indicator-target', serialized)
    }
    let frame = 0
    const schedule = () => {
      if (!frame)
        frame = view.requestAnimationFrame(() => {
          frame = 0
          measure()
        })
    }
    const resize = new view.ResizeObserver(schedule)
    ;[root, panel, trigger].forEach(element => resize.observe(element))
    const changes = new view.MutationObserver(schedule)
    for (let ancestor: HTMLElement | null = root; ancestor; ancestor = ancestor.parentElement)
      changes.observe(ancestor, { attributes: true, attributeFilter: ['dir', 'class', 'style'] })
    measure()
    view.addEventListener('resize', schedule)
    root.ownerDocument.fonts?.addEventListener('loadingdone', schedule)
    return () => {
      resize.disconnect()
      changes.disconnect()
      view.cancelAnimationFrame(frame)
      view.removeEventListener('resize', schedule)
      root.ownerDocument.fonts?.removeEventListener('loadingdone', schedule)
    }
  })
  const hover = () =>
    binding.value === null ? undefined : binding.hover.current.get(binding.value)
  return (
    <ScrollArea
      {...props}
      ref={motionRef}
      aria-label="Navigation sections"
      aria-labelledby={binding.visible === null ? undefined : binding.ids(binding.visible).trigger}
      hidden={!open}
      inert={!open}
      data-slot={joinIds('navigation-menu-viewport', props['data-slot'])}
      data-state={open ? 'open' : 'closed'}
      data-motion={motion}
      className={cn(
        'absolute top-full left-0 z-20 box-border overflow-auto [translate:var(--_rad-indicator-x,var(--_rad-indicator-target-x,0px))_var(--_rad-indicator-y,var(--_rad-indicator-target-y,0px))] w-[var(--_rad-indicator-width,var(--_rad-indicator-target-width,max-content))] h-[var(--_rad-indicator-height,var(--_rad-indicator-target-height,auto))] max-h-[min(70vh,30rem)] rounded-[var(--rad-navigation-menu-radius,var(--rad-surface-radius,0.75rem))] [corner-shape:var(--rad-surface-corner-shape,round)] [border-width:var(--rad-navigation-menu-border-width,var(--rad-surface-border-width,1px))] [border-style:var(--rad-surface-border-style,solid)] border-[var(--rad-navigation-menu-border-color,var(--rad-color-border))] bg-[var(--rad-navigation-menu-background,var(--rad-surface-overlay-background,var(--rad-color-surface)))] text-[var(--rad-navigation-menu-color,var(--rad-color-foreground))] [box-shadow:var(--rad-navigation-menu-shadow,var(--rad-surface-overlay-shadow,0_24px_64px_-16px_rgb(0_0_0/0.3)))] [backdrop-filter:var(--rad-surface-backdrop-filter,none)] [hidden]:hidden forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] forced-colors:border-[CanvasText]',
        className
      )}
      onPointerEnter={composeAction(onPointerEnter, event => {
        if (event.pointerType !== 'touch') hover()?.enter()
      })}
      onPointerLeave={composeAction(onPointerLeave, event => {
        if (event.pointerType !== 'touch') hover()?.leave()
      })}
      onFocusCapture={event => {
        onFocusCapture?.(event)
        hover()?.enter(true)
      }}
      onBlurCapture={event => {
        onBlurCapture?.(event)
        if (!event.currentTarget.contains(event.relatedTarget)) hover()?.leave(true)
      }}
    />
  )
}

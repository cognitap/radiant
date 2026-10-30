'use client'

import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type RefObject
} from 'react'
import {
  MenuRoot,
  MenuTrigger,
  MenuContentRoot,
  MenuPortal,
  MenuItem,
  MenuGroup,
  MenuLabel,
  MenuSeparator,
  MenuCheckboxItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSub,
  MenuSubTrigger,
  MenuSubContent,
  useMenuContext,
  useMenuFamily,
  type MenuTriggerProps,
  type MenuContentProps,
  type MenuPortalProps,
  type MenuItemProps,
  type MenuGroupProps,
  type MenuLabelProps,
  type MenuSeparatorProps,
  type MenuCheckboxItemProps,
  type MenuRadioGroupProps,
  type MenuRadioItemProps,
  type MenuSubProps,
  type MenuSubTriggerProps,
  type MenuSubContentProps,
  type MenuRenderProps
} from './Menu.js'
import { useControllableState } from './react/useControllableState.js'
import { useComposedRefs } from './react/useComposedRefs.js'
import { useRovingFocus } from './react/useRovingFocus.js'
import { requireAccessibleName, type AccessibleName } from './internal/accessibleName.js'
import type { ValueOwner } from './react/useNativeOwner.js'
import type { DistributiveOmit } from './internal/types.js'
import type { ThemeStyle } from './themes/defineTheme.js'
import { cn } from './cn.js'
import { joinIds } from './internal/ids.js'
import { composeAction } from './internal/events.js'

type Intent = 'first' | 'last' | 'none'
export type MenubarProps = Omit<
  ComponentProps<'div'>,
  | 'role'
  | 'aria-orientation'
  | 'tabIndex'
  | 'style'
  | 'defaultValue'
  | 'value'
  | 'contentEditable'
  | 'dangerouslySetInnerHTML'
> &
  AccessibleName &
  ValueOwner<string | null> & {
    onValueChange?: (value: string | null) => void
    loop?: boolean
    style?: ThemeStyle
    'data-slot'?: string
  }
export type MenubarState = {
  value: string | null
  controlled: boolean
  loop: boolean
  setValue: (value: string | null) => void
}
export type MenubarMenuProps = { value: string; children?: ReactNode }
export type MenubarTriggerProps = DistributiveOmit<
  MenuTriggerProps,
  | 'role'
  | 'tabIndex'
  | 'aria-disabled'
  | 'pressed'
  | 'defaultPressed'
  | 'onPressedChange'
  | 'aria-pressed'
>
export type MenubarContentProps = MenuContentProps
export type MenubarPortalProps = MenuPortalProps
export type MenubarItemProps = MenuItemProps
export type MenubarGroupProps = MenuGroupProps
export type MenubarLabelProps = MenuLabelProps
export type MenubarSeparatorProps = MenuSeparatorProps
export type MenubarCheckboxItemProps = MenuCheckboxItemProps
export type MenubarRadioGroupProps = MenuRadioGroupProps
export type MenubarRadioItemProps = MenuRadioItemProps
export type MenubarSubProps = MenuSubProps
export type MenubarSubTriggerProps = MenuSubTriggerProps
export type MenubarSubContentProps = MenuSubContentProps
export type MenubarRenderProps = MenuRenderProps
type Context = MenubarState & {
  host: RefObject<HTMLDivElement | null>
  intent: Intent
  setIntent: (intent: Intent) => void
  request: (value: string | null) => void
  select: (value: string | null, intent?: Intent) => void
  move: (from: string, step: -1 | 1 | 'first' | 'last') => void
}
const MenubarContext = createContext<Context | null>(null),
  MenuValueContext = createContext<string | null>(null)
export function useMenubar(): MenubarState | null {
  return useContext(MenubarContext)
}
function useBar() {
  const bar = useContext(MenubarContext)
  if (!bar) throw new Error('Menubar parts must render inside Menubar.')
  return bar
}
function useOwner() {
  const bar = useBar(),
    value = useContext(MenuValueContext),
    family = useMenuFamily()
  if (value === null || family !== 'menubar')
    throw new Error('Menubar parts must render inside MenubarMenu.')
  return { bar, value }
}
const selector = 'button[data-slot~="menubar-trigger"]'
export function Menubar({
  ref,
  value,
  defaultValue,
  onValueChange,
  loop = true,
  className,
  onFocus,
  onBlur,
  onKeyDown,
  children,
  ...props
}: MenubarProps) {
  requireAccessibleName('Menubar', props)
  const state = useControllableState<string | null>({
      name: 'Menubar',
      value,
      defaultValue,
      initialValue: null,
      onChange: onValueChange
    }),
    [intent, setIntent] = useState<Intent>('first'),
    host = useRef<HTMLDivElement>(null),
    composed = useComposedRefs(host, ref)
  if (state.value !== null && typeof state.value !== 'string')
    throw new TypeError('Menubar value must be a string or null.')
  const roving = useRovingFocus({
    host,
    selector,
    scope: '[data-slot~="menubar"]',
    orientation: 'horizontal',
    loop,
    preferred: state.value,
    includeAriaDisabled: true
  })
  const select = (next: string | null, edge: Intent = 'first') => {
    setIntent(edge)
    state.request(next)
  }
  const move = (from: string, step: -1 | 1 | 'first' | 'last') => {
    const node = host.current
    if (!node) return
    const triggers = roving.items(node),
      index = triggers.findIndex(trigger => trigger.dataset.value === from)
    if (index < 0 || !triggers.length) return
    const nextIndex =
      step === 'first'
        ? 0
        : step === 'last'
          ? triggers.length - 1
          : loop
            ? (index + step + triggers.length) % triggers.length
            : Math.max(0, Math.min(triggers.length - 1, index + step))
    const next = triggers[nextIndex]
    if (!next || next === triggers[index]) return
    if (next.getAttribute('aria-disabled') === 'true' || next.getAttribute('aria-busy') === 'true')
      next.focus({ preventScroll: true })
    else if (next.dataset.value !== undefined) select(next.dataset.value, 'first')
  }
  return (
    <MenubarContext.Provider
      value={{
        value: state.value,
        controlled: state.controlled,
        loop,
        setValue: next => select(next),
        host,
        intent,
        setIntent,
        select,
        request: state.request,
        move
      }}
    >
      <div
        {...props}
        ref={composed}
        role="menubar"
        aria-orientation="horizontal"
        tabIndex={-1}
        contentEditable={undefined}
        dangerouslySetInnerHTML={undefined}
        data-slot={joinIds('menubar', props['data-slot'])}
        data-state={state.value === null ? 'closed' : 'open'}
        className={cn(
          'inline-flex w-fit max-w-full flex-wrap items-center gap-[var(--rad-menubar-gap,0.25rem)] p-[var(--rad-menubar-padding,0.25rem)] rounded-[var(--rad-menubar-radius,var(--rad-control-radius,0.5rem))] bg-[var(--rad-menubar-background,var(--rad-color-surface))]',
          className
        )}
        onFocus={event => {
          onFocus?.(event)
          roving.onFocus(event)
        }}
        onBlur={event => {
          onBlur?.(event)
          roving.onBlur(event)
        }}
        onKeyDown={event => {
          onKeyDown?.(event)
          if (event.defaultPrevented) return
          const target = event.target as HTMLElement,
            current = target.closest<HTMLElement>(selector)
          if (
            state.value !== null &&
            current?.closest('[data-slot~="menubar"]') === event.currentTarget &&
            !target.closest('[role="menu"]') &&
            !event.altKey &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.nativeEvent.isComposing
          ) {
            const rtl =
                event.currentTarget.ownerDocument.defaultView!.getComputedStyle(event.currentTarget)
                  .direction === 'rtl',
              step =
                event.key === 'Home'
                  ? 'first'
                  : event.key === 'End'
                    ? 'last'
                    : event.key === (rtl ? 'ArrowLeft' : 'ArrowRight')
                      ? 1
                      : event.key === (rtl ? 'ArrowRight' : 'ArrowLeft')
                        ? -1
                        : null
            if (step !== null && current.dataset.value !== undefined) {
              event.preventDefault()
              move(current.dataset.value, step)
              return
            }
          }
          roving.onKeyDown(event)
        }}
      >
        {children}
      </div>
    </MenubarContext.Provider>
  )
}
export function MenubarMenu({ value, children }: MenubarMenuProps) {
  const bar = useBar()
  if (typeof value !== 'string') throw new TypeError('MenubarMenu requires a string value.')
  return (
    <MenuRoot
      open={bar.value === value}
      onOpenChange={next => {
        if (next) bar.request(value)
        else if (bar.value === value) bar.request(null)
      }}
      family="menubar"
      parent={undefined}
      anchorPoint={undefined}
      focusIntent={bar.intent}
    >
      <MenuOwner value={value}>{children}</MenuOwner>
    </MenuRoot>
  )
}
function MenuOwner({ value, children }: MenubarMenuProps) {
  const bar = useBar(),
    menu = useMenuContext(),
    intent = useRef(bar.intent)
  useLayoutEffect(() => {
    intent.current = bar.intent
  })
  useLayoutEffect(() => {
    if (menu.open && intent.current === 'none') menu.trigger.current?.focus({ preventScroll: true })
  }, [menu.open, menu.trigger])
  return <MenuValueContext.Provider value={value}>{children}</MenuValueContext.Provider>
}
export function MenubarTrigger({
  disabled = false,
  pending = false,
  ref,
  onClick,
  onKeyDown,
  onPointerMove,
  className,
  variant = 'ghost',
  tone = 'neutral',
  motion,
  ...props
}: MenubarTriggerProps) {
  const { bar, value } = useOwner(),
    menu = useMenuContext()
  if (menu.parent) throw new Error('MenubarTrigger belongs directly to MenubarMenu.')
  return (
    <MenuTrigger
      {...props}
      ref={ref}
      disabled={undefined}
      motion={disabled ? 'off' : motion}
      pending={pending}
      role="menuitem"
      tabIndex={-1}
      aria-disabled={disabled || undefined}
      variant={variant}
      tone={tone}
      data-value={value}
      data-slot={joinIds('menubar-trigger', props['data-slot'])}
      className={cn(
        'aria-expanded:bg-[var(--rad-menu-item-focus-background,color-mix(in_oklab,var(--rad-color-accent)_12%,var(--rad-color-surface)))] aria-expanded:[color:var(--rad-menu-item-focus-color,color-mix(in_oklab,var(--rad-color-accent)_25%,var(--rad-color-foreground)))] aria-disabled:cursor-not-allowed aria-disabled:opacity-[var(--rad-state-disabled-opacity,0.5)] forced-colors:aria-disabled:text-[GrayText] forced-colors:aria-disabled:opacity-100',
        className
      )}
      onClick={composeAction(
        onClick,
        () => bar.setIntent('first'),
        () => disabled
      )}
      onKeyDown={event => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
          if (disabled || pending || event.currentTarget.matches(':disabled')) {
            event.preventDefault()
            return
          }
          bar.setIntent(event.key === 'ArrowUp' ? 'last' : 'first')
        }
      }}
      onPointerMove={event => {
        onPointerMove?.(event)
        if (
          event.defaultPrevented ||
          event.pointerType === 'touch' ||
          disabled ||
          pending ||
          event.currentTarget.matches(':disabled') ||
          bar.value === null ||
          bar.value === value
        )
          return
        bar.select(value, 'none')
      }}
    />
  )
}
export function MenubarContent({ onKeyDown, ...props }: MenubarContentProps) {
  const { bar, value } = useOwner()
  return (
    <MenuContentRoot
      {...props}
      onFocusOutside={() => {
        const node = bar.host.current
        if (node && !node.contains(node.ownerDocument.activeElement)) bar.select(null)
      }}
      data-slot={joinIds('menubar-content', props['data-slot'])}
      onKeyDown={event => {
        onKeyDown?.(event)
        if (
          event.defaultPrevented ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          event.nativeEvent.isComposing
        )
          return
        const node = bar.host.current
        if (!node) return
        const rtl = node.ownerDocument.defaultView!.getComputedStyle(node).direction === 'rtl'
        if (event.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) {
          event.preventDefault()
          bar.move(value, 1)
        } else if (
          event.key === (rtl ? 'ArrowRight' : 'ArrowLeft') &&
          (event.target as HTMLElement).closest('[role="menu"]') === event.currentTarget
        ) {
          event.preventDefault()
          bar.move(value, -1)
        }
      }}
    />
  )
}
export function MenubarPortal(props: MenubarPortalProps) {
  useOwner()
  return <MenuPortal {...props} />
}
export function MenubarItem(props: MenubarItemProps) {
  useOwner()
  return (
    <MenuItem
      {...props}
      data-slot={joinIds('menubar-item', props['data-slot'])}
    />
  )
}
export function MenubarGroup(props: MenubarGroupProps) {
  useOwner()
  return (
    <MenuGroup
      {...props}
      data-slot={joinIds('menubar-group', props['data-slot'])}
    />
  )
}
export function MenubarLabel(props: MenubarLabelProps) {
  useOwner()
  return (
    <MenuLabel
      {...props}
      data-slot={joinIds('menubar-label', props['data-slot'])}
    />
  )
}
export function MenubarSeparator(props: MenubarSeparatorProps) {
  useOwner()
  return (
    <MenuSeparator
      {...props}
      data-slot={joinIds('menubar-separator', props['data-slot'])}
    />
  )
}
export function MenubarCheckboxItem(props: MenubarCheckboxItemProps) {
  useOwner()
  return (
    <MenuCheckboxItem
      {...props}
      data-slot={joinIds('menubar-checkbox-item', props['data-slot'])}
    />
  )
}
export function MenubarRadioGroup(props: MenubarRadioGroupProps) {
  useOwner()
  return (
    <MenuRadioGroup
      {...props}
      data-slot={joinIds('menubar-radio-group', props['data-slot'])}
    />
  )
}
export function MenubarRadioItem(props: MenubarRadioItemProps) {
  useOwner()
  return (
    <MenuRadioItem
      {...props}
      data-slot={joinIds('menubar-radio-item', props['data-slot'])}
    />
  )
}
export function MenubarSub(props: MenubarSubProps) {
  useOwner()
  return <MenuSub {...props} />
}
export function MenubarSubTrigger(props: MenubarSubTriggerProps) {
  useOwner()
  return (
    <MenuSubTrigger
      {...props}
      data-slot={joinIds('menubar-sub-trigger', props['data-slot'])}
    />
  )
}
export function MenubarSubContent(props: MenubarSubContentProps) {
  useOwner()
  return (
    <MenuSubContent
      {...props}
      data-slot={joinIds('menubar-sub-content', props['data-slot'])}
    />
  )
}

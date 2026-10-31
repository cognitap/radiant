'use client'

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
  type RefObject
} from 'react'
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverContentRoot,
  PopoverCloseRoot,
  PopoverPortal,
  usePopover,
  usePopoverContext,
  type PopoverProps,
  type PopoverState,
  type PopoverContentProps
} from './Popover.js'
import type { ButtonProps, ButtonRenderProps } from './Button.js'
import type { DistributiveOmit, WithoutToggle } from './internal/types.js'
import { Separator, type SeparatorProps } from './Separator.js'
import { useControllableState } from './react/useControllableState.js'
import type { CheckedOwner, ValueOwner } from './react/useNativeOwner.js'
import type { ThemeStyle } from './themes/defineTheme.js'
import type { PartStyle } from './presentation.js'
import { cn } from './cn.js'
import { itemGroupLabelClass } from './controlStyles.js'
import { composeAction } from './internal/events.js'
import { joinIds } from './internal/ids.js'
import { matchSelectText } from './internal/select.js'
import { useComposedRefs } from './react/useComposedRefs.js'

export type MenuProps = PopoverProps
export type MenuState = PopoverState
export type MenuRenderProps = ButtonRenderProps
export type MenuPortalProps = { children?: ReactNode }
export type MenuTriggerProps = WithoutToggle<DistributiveOmit<ButtonProps, 'id' | 'aria-haspopup'>>
export type MenuContentProps = Omit<
  PopoverContentProps,
  'role' | 'aria-labelledby' | 'aria-orientation' | 'tabIndex' | 'initialFocusRef'
>
export type MenuItemProps = WithoutToggle<
  DistributiveOmit<ButtonProps, 'role' | 'tabIndex' | 'aria-disabled' | 'onSelect'>
> & {
  textValue?: string
  closeOnSelect?: boolean
  onSelect?: (event: MouseEvent<HTMLButtonElement>) => void
}
type Intent = 'first' | 'last' | 'none'
type MenuFamily = 'menu' | 'context-menu' | 'menubar'
type Context = MenuState & {
  parent?: Context
  family: MenuFamily
  focusIntent?: Intent
  closeTree(): void
  triggerId: string
  trigger: RefObject<HTMLElement | null>
  setTrigger: (node: HTMLElement | null) => void
  content: RefObject<HTMLDivElement | null>
  intent: RefObject<Intent>
  setIntent: (edge: Intent) => void
}
const MenuContext = createContext<Context | null>(null)
export function useMenu(): MenuState | null {
  return useContext(MenuContext)
}
/** Private family guard for composed menus. */
export function useMenuFamily() {
  return useContext(MenuContext)?.family
}
/** Private composition seam; not exported from the package. */
export function useMenuContext() {
  const menu = useContext(MenuContext)
  if (!menu) throw new Error('Menu parts must render inside Menu.')
  return menu
}
export function Menu(props: MenuProps) {
  return (
    <MenuRoot
      {...props}
      anchorPoint={undefined}
      family="menu"
      parent={undefined}
      focusIntent={undefined}
    />
  )
}
/** Composed families share one owner and native surface tree. */
export function MenuRoot({
  children,
  parent,
  family = 'menu',
  anchorPoint,
  focusIntent,
  ...props
}: MenuProps & {
  parent?: Context
  family?: MenuFamily
  focusIntent?: Intent
  anchorPoint?: { x: number; y: number }
}) {
  return (
    <PopoverRoot
      {...props}
      anchorPoint={anchorPoint}
    >
      <MenuOwner
        parent={parent}
        family={family}
        focusIntent={focusIntent}
      >
        {children}
      </MenuOwner>
    </PopoverRoot>
  )
}
function MenuOwner({
  children,
  parent,
  family,
  focusIntent
}: {
  children?: ReactNode
  parent?: Context
  family: MenuFamily
  focusIntent?: Intent
}) {
  const state = usePopover()!
  const triggerId = useId()
  const trigger = useRef<HTMLElement>(null)
  const setTrigger = useCallback((node: HTMLElement | null) => {
    trigger.current = node
  }, [])
  const content = useRef<HTMLDivElement>(null)
  const intent = useRef<Intent>('first')
  return (
    <RadioContext.Provider value={null}>
      <MenuContext.Provider
        value={{
          ...state,
          triggerId,
          trigger,
          setTrigger,
          content,
          intent,
          parent,
          family,
          focusIntent,
          setIntent: edge => {
            intent.current = edge
          },
          closeTree: () => {
            state.setOpen(false)
            parent?.closeTree()
          }
        }}
      >
        {children}
      </MenuContext.Provider>
    </RadioContext.Provider>
  )
}

function items(node: HTMLElement) {
  return Array.from(
    node.querySelectorAll<HTMLButtonElement>(
      'button[role="menuitem"],button[role="menuitemcheckbox"],button[role="menuitemradio"]'
    )
  ).filter(item => item.closest('[role="menu"]') === node)
}
function focusItem(node: HTMLElement, item?: HTMLButtonElement) {
  for (const candidate of items(node)) candidate.tabIndex = candidate === item ? 0 : -1
  ;(item ?? node).focus({ preventScroll: true })
}
export function MenuTrigger({ ref, onKeyDown, onClick, ...props }: MenuTriggerProps) {
  const menu = useMenuContext()
  const host = useComposedRefs<HTMLButtonElement>(menu.setTrigger, ref)
  return (
    <PopoverTrigger
      {...props}
      ref={host}
      id={menu.triggerId}
      aria-haspopup="menu"
      data-slot={joinIds('menu-trigger', props['data-slot'])}
      onClick={composeAction(onClick, () => {
        menu.setIntent('first')
      })}
      onKeyDown={composeAction(onKeyDown, event => {
        if (
          (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') ||
          props.disabled ||
          props.pending ||
          event.currentTarget.matches(':disabled')
        )
          return
        event.preventDefault()
        menu.setIntent(event.key === 'ArrowUp' ? 'last' : 'first')
        if (menu.open && menu.content.current) {
          const options = items(menu.content.current)
          focusItem(
            menu.content.current,
            menu.intent.current === 'last' ? options.at(-1) : options[0]
          )
        } else menu.setOpen(true)
      })}
    />
  )
}
export function MenuPortal(props: MenuPortalProps) {
  useMenuContext()
  return <PopoverPortal {...props} />
}
export function MenuContent(props: MenuContentProps) {
  return (
    <MenuContentRoot
      {...props}
      onFocusOutside={undefined}
    />
  )
}
/** Private bar focus boundary; public Menu retains shared outside dismissal. */
export function MenuContentRoot({
  ref,
  className,
  onKeyDown,
  onFocusOutside,
  ...props
}: MenuContentProps & { onFocusOutside?: () => void }) {
  const menu = useMenuContext()
  const nested = !!menu.parent || menu.family === 'menubar'
  const triggerId = menu.triggerId
  const capture = useCallback(
    (node: HTMLDivElement | null) => {
      const trigger = node?.ownerDocument.getElementById(triggerId)
      // Establish the submenu's reading order before the native surface opens.
      if (
        nested &&
        node &&
        trigger &&
        node.parentElement === trigger.parentElement &&
        trigger.nextElementSibling !== node &&
        !node.matches(':popover-open')
      )
        trigger.after(node)
    },
    [triggerId, nested]
  )
  const placed = useComposedRefs(menu.content, capture)
  const host = useComposedRefs(placed, ref)
  const search = useRef({ text: '', time: 0 })
  const openIntent = useRef(menu.focusIntent)
  useLayoutEffect(() => {
    openIntent.current = menu.focusIntent
  })

  useLayoutEffect(() => {
    search.current = { text: '', time: 0 }
    const node = menu.content.current
    if (!menu.open || !node) return
    const edge = openIntent.current ?? menu.intent.current
    if (edge === 'none') return
    const options = items(node)
    focusItem(node, edge === 'last' ? options.at(-1) : options[0])
  }, [menu.open, menu.content, menu.intent])
  return (
    <PopoverContentRoot
      {...props}
      ref={host}
      onFocusOutside={onFocusOutside}
      initialFocusRef={undefined}
      role="menu"
      aria-orientation="vertical"
      aria-labelledby={menu.triggerId}
      tabIndex={-1}
      data-slot={joinIds('menu-content', props['data-slot'])}
      className={cn(
        'w-[var(--rad-menu-width,16rem)] gap-0 p-[var(--rad-menu-padding,0.25rem)] rounded-[var(--rad-menu-radius,var(--rad-surface-radius,0.75rem))]',
        '[--_rad-item-radius:max(0px,calc(var(--rad-menu-radius,var(--rad-surface-radius,0.75rem))-var(--rad-menu-padding,0.25rem)))] [--_rad-item-corner-shape:var(--rad-popover-corner-shape,var(--rad-surface-corner-shape,round))]',
        'bg-[var(--rad-menu-background,var(--rad-surface-overlay-background,var(--rad-color-surface,white)))] [color:var(--rad-menu-color,var(--rad-color-foreground))] [border-color:var(--rad-menu-border-color,var(--rad-color-border))] [border-width:var(--rad-menu-border-width,var(--rad-surface-border-width,1px))] [border-style:var(--rad-menu-border-style,var(--rad-surface-border-style,solid))] [box-shadow:var(--rad-menu-shadow,var(--rad-surface-overlay-shadow,0_24px_64px_-16px_rgb(0_0_0/0.3)))]',
        'forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]',
        className
      )}
      onKeyDown={event => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        const node = event.currentTarget
        const target = event.target as HTMLElement
        if (target.closest('[role="menu"]') !== node) return
        if (event.key === 'Tab') {
          // Let the browser continue from the opener after closing, in either direction.
          let root = menu
          while (root.parent) root = root.parent
          root.trigger.current?.focus({ preventScroll: true })
          menu.closeTree()
          return
        }
        if (event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing) return
        const options = items(node)
        const index = options.indexOf(node.ownerDocument.activeElement as HTMLButtonElement)
        let next: HTMLButtonElement | undefined
        if (event.key === 'Home') next = options[0]
        else if (event.key === 'End') next = options.at(-1)
        else if (event.key === 'ArrowDown') next = options[(index + 1) % options.length]
        else if (event.key === 'ArrowUp')
          next = options[(index - 1 + options.length) % options.length]
        else if (event.key.length === 1 && event.key !== ' ') {
          const now = node.ownerDocument.defaultView!.performance.now()
          search.current.text =
            (now - search.current.time > 700 ? '' : search.current.text) + event.key
          search.current.time = now
          const match = matchSelectText(
            options.map((item, i) => ({
              value: String(i),
              textValue: item.dataset.textValue ?? item.textContent ?? ''
            })),
            search.current.text,
            String(index)
          )
          if (match !== undefined) next = options[Number(match)]
        } else return
        event.preventDefault()
        if (next) focusItem(node, next)
      }}
    />
  )
}
const menuItemClass = [
  'relative box-border flex w-full min-w-0 cursor-default select-none items-center text-start [font:inherit] [color:inherit] bg-transparent border-0 outline-none',
  '[&>span:first-child]:min-w-0 [&>span:first-child]:flex-1',
  'p-[var(--rad-menu-item-padding,0.625rem)] rounded-[var(--rad-menu-item-radius,var(--_rad-item-radius,var(--rad-control-radius,0.5rem)))] [corner-shape:var(--_rad-item-corner-shape,var(--rad-control-corner-shape,round))]',
  'transition-colors duration-[var(--rad-motion-color-duration,150ms)] motion-reduce:transition-none',
  'hover:bg-[var(--rad-menu-item-focus-background,var(--rad-control-item-highlight-background,color-mix(in_oklab,var(--rad-color-accent)_12%,var(--rad-color-surface))))] focus:bg-[var(--rad-menu-item-focus-background,var(--rad-control-item-highlight-background,color-mix(in_oklab,var(--rad-color-accent)_12%,var(--rad-color-surface))))]',
  'hover:[color:var(--rad-menu-item-focus-color,var(--rad-control-item-highlight-foreground,color-mix(in_oklab,var(--rad-color-accent)_25%,var(--rad-color-foreground))))] focus:[color:var(--rad-menu-item-focus-color,var(--rad-control-item-highlight-foreground,color-mix(in_oklab,var(--rad-color-accent)_25%,var(--rad-color-foreground))))]',
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-[var(--rad-state-disabled-opacity,0.5)] forced-colors:aria-disabled:text-[GrayText] forced-colors:aria-disabled:opacity-100',
  'forced-colors:focus:bg-[Highlight] forced-colors:focus:text-[HighlightText] forced-colors:focus-visible:outline-solid forced-colors:focus-visible:[outline-width:var(--rad-focus-width,2px)] forced-colors:focus-visible:-outline-offset-2'
].join(' ')
export function MenuItem(props: MenuItemProps) {
  return (
    <MenuItemRoot
      {...props}
      itemRole="menuitem"
      checkedValue={undefined}
    />
  )
}
function MenuItemRoot({
  itemRole = 'menuitem',
  checkedValue,
  closeOnSelect = true,
  disabled = false,
  textValue,
  onSelect,
  onClick,
  onFocus,
  onPointerMove,
  className,
  render,
  motion,
  ...props
}: MenuItemProps & {
  itemRole?: 'menuitem' | 'menuitemcheckbox' | 'menuitemradio'
  checkedValue?: boolean | 'mixed'
}) {
  const menu = useMenuContext()
  return (
    <PopoverCloseRoot
      requestClose={menu.closeTree}
      closeOnClick={closeOnSelect}
      {...props}
      disabled={undefined}
      aria-disabled={disabled || undefined}
      role={itemRole}
      aria-checked={checkedValue ?? props['aria-checked']}
      tabIndex={-1}
      motion={disabled ? 'off' : motion}
      data-slot={joinIds('menu-item', props['data-slot'])}
      data-text-value={textValue}
      // A menu row plays the item role, so it takes none of Button's action look.
      render={resolved => {
        const native = { ...resolved, className: cn(menuItemClass, className) }
        return render ? render(native) : <button {...native} />
      }}
      onClick={composeAction(onClick, onSelect, () => disabled)}
      onFocus={event => {
        onFocus?.(event)
        const node = menu.content.current
        if (node)
          for (const item of items(node)) item.tabIndex = item === event.currentTarget ? 0 : -1
      }}
      onPointerMove={composeAction(onPointerMove, event => {
        if (event.pointerType !== 'touch') event.currentTarget.focus({ preventScroll: true })
      })}
    />
  )
}

export type MenuGroupProps = Omit<ComponentProps<'div'>, 'style' | 'role'> & {
  style?: ThemeStyle
  'data-slot'?: string
}
export type MenuLabelProps = Omit<ComponentProps<'div'>, 'style' | 'role' | 'tabIndex'> & {
  style?: ThemeStyle
  'data-slot'?: string
}
export type MenuSeparatorProps = SeparatorProps
/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Menu sections are ARIA groups, not native form fieldsets. */
export function MenuGroup({ className, ...props }: MenuGroupProps) {
  useMenuContext()
  return (
    <div
      {...props}
      role="group"
      data-slot={joinIds('menu-group', props['data-slot'])}
      className={cn('grid gap-0', className)}
    />
  )
}
/* oxlint-enable jsx-a11y/prefer-tag-over-role */
export function MenuLabel({ className, ...props }: MenuLabelProps) {
  useMenuContext()
  return (
    <div
      {...props}
      role="presentation"
      tabIndex={undefined}
      data-slot={joinIds('menu-label', props['data-slot'])}
      className={cn(itemGroupLabelClass, 'px-[var(--rad-menu-item-padding,0.625rem)]', className)}
    />
  )
}
export function MenuSeparator(props: MenuSeparatorProps) {
  useMenuContext()
  return (
    <Separator
      {...props}
      data-slot={joinIds('menu-separator', props['data-slot'])}
    />
  )
}
type CheckableProps = DistributiveOmit<MenuItemProps, 'aria-checked' | 'type'> & {
  parts?: { indicator?: PartStyle }
}
export type MenuCheckboxItemProps = CheckableProps &
  CheckedOwner & { onCheckedChange?: (checked: boolean) => void; indeterminate?: boolean }
const plainText = (children: ReactNode) =>
  typeof children === 'string' || typeof children === 'number' ? String(children) : undefined
function CheckMark({ children, part }: { children?: ReactNode; part?: PartStyle }) {
  return (
    <span
      aria-hidden="true"
      data-slot="menu-item-indicator"
      className={cn('inline-flex w-4 shrink-0 items-center justify-center', part?.className)}
      style={part?.style}
    >
      {children}
    </span>
  )
}
export function MenuCheckboxItem({
  checked,
  defaultChecked,
  onCheckedChange,
  indeterminate = false,
  parts,
  children,
  textValue,
  onSelect,
  closeOnSelect = false,
  ...props
}: MenuCheckboxItemProps) {
  const state = useControllableState({
    name: 'MenuCheckboxItem',
    value: checked,
    defaultValue: defaultChecked,
    initialValue: false,
    onChange: onCheckedChange
  })
  return (
    <MenuItemRoot
      {...props}
      type="button"
      itemRole="menuitemcheckbox"
      checkedValue={indeterminate ? 'mixed' : state.value}
      closeOnSelect={closeOnSelect}
      textValue={textValue ?? plainText(children)}
      data-slot={joinIds('menu-checkbox-item', props['data-slot'])}
      onSelect={event => {
        onSelect?.(event)
        if (!event.defaultPrevented) state.request(indeterminate || !state.value)
      }}
    >
      <CheckMark part={parts?.indicator}>
        {indeterminate ? '−' : state.value ? '✓' : null}
      </CheckMark>
      {children}
    </MenuItemRoot>
  )
}
export type MenuRadioGroupProps = Omit<MenuGroupProps, 'defaultValue'> &
  ValueOwner<string | null> & { onValueChange?: (value: string | null) => void }
type RadioContextValue = { value: string | null; request: (value: string) => void }
const RadioContext = createContext<RadioContextValue | null>(null)
export function MenuRadioGroup({
  value,
  defaultValue,
  onValueChange,
  ...props
}: MenuRadioGroupProps) {
  const state = useControllableState<string | null>({
    name: 'MenuRadioGroup',
    value,
    defaultValue,
    initialValue: null,
    onChange: onValueChange
  })
  return (
    <RadioContext.Provider value={{ value: state.value, request: state.request }}>
      <MenuGroup
        {...props}
        data-slot={joinIds('menu-radio-group', props['data-slot'])}
      />
    </RadioContext.Provider>
  )
}
export type MenuRadioItemProps = DistributiveOmit<CheckableProps, 'value'> & { value: string }
export function MenuRadioItem({
  value,
  children,
  textValue,
  parts,
  onSelect,
  closeOnSelect = false,
  ...props
}: MenuRadioItemProps) {
  const radio = useContext(RadioContext)
  if (!radio) throw new Error('MenuRadioItem must render inside MenuRadioGroup.')
  if (typeof value !== 'string') throw new TypeError('MenuRadioItem needs a string value.')
  const checked = radio.value === value
  return (
    <MenuItemRoot
      {...props}
      type="button"
      value={value}
      itemRole="menuitemradio"
      checkedValue={checked}
      closeOnSelect={closeOnSelect}
      textValue={textValue ?? plainText(children)}
      data-slot={joinIds('menu-radio-item', props['data-slot'])}
      onSelect={event => {
        onSelect?.(event)
        if (!event.defaultPrevented) radio.request(value)
      }}
    >
      <CheckMark part={parts?.indicator}>{checked ? '●' : null}</CheckMark>
      {children}
    </MenuItemRoot>
  )
}
export type MenuSubProps = MenuProps
export type MenuSubTriggerProps = DistributiveOmit<
  MenuItemProps,
  'closeOnSelect' | 'id' | 'aria-haspopup' | 'aria-expanded' | 'aria-controls' | 'type'
> & { parts?: { indicator?: PartStyle } }
export type MenuSubContentProps = MenuContentProps
export function MenuSub(props: MenuSubProps) {
  const parent = useMenuContext()
  return (
    <MenuRoot
      {...props}
      anchorPoint={undefined}
      parent={parent}
      family={parent.family}
      focusIntent={undefined}
    />
  )
}
function openMenu(menu: Context, edge: Intent) {
  menu.setIntent(edge)
  if (menu.open && menu.content.current) {
    if (edge !== 'none') {
      const options = items(menu.content.current)
      focusItem(menu.content.current, edge === 'last' ? options.at(-1) : options[0])
    }
  } else menu.setOpen(true)
}
export function MenuSubTrigger({
  ref,
  children,
  textValue,
  parts,
  className,
  onSelect,
  onKeyDown,
  onPointerMove,
  disabled,
  pending,
  ...props
}: MenuSubTriggerProps) {
  const menu = useMenuContext(),
    popover = usePopoverContext(),
    host = useComposedRefs<HTMLButtonElement>(menu.setTrigger, ref),
    anchor = useComposedRefs<HTMLButtonElement>(popover.setTrigger, host)
  if (!menu.parent) throw new Error('MenuSubTrigger must render inside MenuSub.')
  return (
    <MenuContext.Provider value={menu.parent}>
      <MenuItemRoot
        {...props}
        textValue={textValue ?? plainText(children)}
        disabled={disabled}
        pending={pending}
        ref={anchor}
        type="button"
        id={menu.triggerId}
        aria-haspopup="menu"
        aria-controls={menu.contentId}
        aria-expanded={menu.open}
        data-slot={joinIds('menu-sub-trigger', props['data-slot'])}
        closeOnSelect={false}
        className={cn(
          'aria-expanded:bg-[var(--rad-menu-item-focus-background,var(--rad-control-item-highlight-background,color-mix(in_oklab,var(--rad-color-accent)_12%,var(--rad-color-surface))))] aria-expanded:[color:var(--rad-menu-item-focus-color,var(--rad-control-item-highlight-foreground,color-mix(in_oklab,var(--rad-color-accent)_25%,var(--rad-color-foreground))))]',
          className
        )}
        onSelect={event => {
          onSelect?.(event)
          if (!event.defaultPrevented) openMenu(menu, 'first')
        }}
        onKeyDown={composeAction(onKeyDown, event => {
          const rtl =
            event.currentTarget.ownerDocument.defaultView!.getComputedStyle(event.currentTarget)
              .direction === 'rtl'
          if (
            event.key !== (rtl ? 'ArrowLeft' : 'ArrowRight') ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            event.nativeEvent.isComposing ||
            disabled ||
            pending ||
            event.currentTarget.matches(':disabled')
          )
            return
          event.preventDefault()
          openMenu(menu, 'first')
        })}
        onPointerMove={composeAction(onPointerMove, event => {
          if (
            event.pointerType !== 'touch' &&
            !disabled &&
            !pending &&
            !event.currentTarget.matches(':disabled')
          )
            openMenu(menu, 'none')
        })}
      >
        <span className="min-w-0 flex-1">{children}</span>
        <CheckMark part={parts?.indicator}>
          <span className="inline-block rtl:rotate-180">›</span>
        </CheckMark>
      </MenuItemRoot>
    </MenuContext.Provider>
  )
}
export function MenuSubContent({ side, onKeyDown, ...props }: MenuSubContentProps) {
  const menu = useMenuContext(),
    [inlineSide, setInlineSide] = useState<'right' | 'left'>('right')
  if (!menu.parent) throw new Error('MenuSubContent must render inside MenuSub.')
  useLayoutEffect(() => {
    const trigger = menu.trigger.current
    if (!trigger) return
    const view = trigger.ownerDocument.defaultView!,
      update = () =>
        setInlineSide(view.getComputedStyle(trigger).direction === 'rtl' ? 'left' : 'right'),
      observer = new view.MutationObserver(update)
    update()
    for (let node: HTMLElement | null = trigger; node; node = node.parentElement)
      observer.observe(node, { attributes: true, attributeFilter: ['dir', 'class', 'style'] })
    view.addEventListener('resize', update)
    return () => {
      observer.disconnect()
      view.removeEventListener('resize', update)
    }
  }, [menu.trigger])
  return (
    <MenuContent
      {...props}
      side={side ?? inlineSide}
      sideOffset={props.sideOffset ?? 4}
      data-slot={joinIds('menu-sub-content', props['data-slot'])}
      onKeyDown={composeAction(onKeyDown, event => {
        const rtl =
          event.currentTarget.ownerDocument.defaultView!.getComputedStyle(event.currentTarget)
            .direction === 'rtl'
        if (
          event.key !== (rtl ? 'ArrowRight' : 'ArrowLeft') ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          event.nativeEvent.isComposing ||
          (event.target as HTMLElement).closest('[role="menu"]') !== event.currentTarget
        )
          return
        event.preventDefault()
        event.stopPropagation()
        menu.setOpen(false)
        menu.trigger.current?.focus({ preventScroll: true })
      })}
    />
  )
}

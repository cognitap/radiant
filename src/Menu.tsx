'use client'

import {
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  type MouseEvent,
  type ReactNode,
  type RefObject
} from 'react'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
  PopoverPortal,
  usePopover,
  type PopoverProps,
  type PopoverState,
  type PopoverContentProps
} from './Popover.js'
import type { ButtonProps, ButtonRenderProps } from './Button.js'
import { cn } from './cn.js'
import { composeAction } from './internal/events.js'
import { joinIds } from './internal/ids.js'
import { matchSelectText } from './internal/select.js'
import { useComposedRefs } from './react/useComposedRefs.js'

export type MenuProps = PopoverProps
export type MenuState = PopoverState
export type MenuRenderProps = ButtonRenderProps
export type MenuPortalProps = { children?: ReactNode }
export type MenuTriggerProps = Omit<ButtonProps, 'id' | 'aria-haspopup'>
export type MenuContentProps = Omit<
  PopoverContentProps,
  'role' | 'aria-labelledby' | 'aria-orientation' | 'tabIndex' | 'initialFocusRef'
>
export type MenuItemProps = Omit<
  ButtonProps,
  'role' | 'tabIndex' | 'aria-disabled' | 'onSelect'
> & {
  textValue?: string
  onSelect?: (event: MouseEvent<HTMLButtonElement>) => void
}
type Context = MenuState & {
  triggerId: string
  trigger: RefObject<HTMLButtonElement | null>
  content: RefObject<HTMLDivElement | null>
  intent: RefObject<'first' | 'last'>
  setIntent: (edge: 'first' | 'last') => void
}
const MenuContext = createContext<Context | null>(null)
export function useMenu(): MenuState | null {
  return useContext(MenuContext)
}
function useMenuContext() {
  const menu = useContext(MenuContext)
  if (!menu) throw new Error('Menu parts must render inside Menu.')
  return menu
}
export function Menu({ children, ...props }: MenuProps) {
  return (
    <Popover {...props}>
      <MenuOwner>{children}</MenuOwner>
    </Popover>
  )
}
function MenuOwner({ children }: { children?: ReactNode }) {
  const state = usePopover()!
  const triggerId = useId()
  const trigger = useRef<HTMLButtonElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const intent = useRef<'first' | 'last'>('first')
  return (
    <MenuContext.Provider
      value={{
        ...state,
        triggerId,
        trigger,
        content,
        intent,
        setIntent: edge => {
          intent.current = edge
        }
      }}
    >
      {children}
    </MenuContext.Provider>
  )
}
function items(node: HTMLElement) {
  return Array.from(node.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]')).filter(
    item => item.closest('[role="menu"]') === node
  )
}
function focusItem(node: HTMLElement, item?: HTMLButtonElement) {
  for (const candidate of items(node)) candidate.tabIndex = candidate === item ? 0 : -1
  ;(item ?? node).focus({ preventScroll: true })
}
export function MenuTrigger({ ref, onKeyDown, onClick, ...props }: MenuTriggerProps) {
  const menu = useMenuContext()
  const host = useComposedRefs(menu.trigger, ref)
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
export function MenuContent({ ref, className, onKeyDown, ...props }: MenuContentProps) {
  const menu = useMenuContext()
  const host = useComposedRefs(menu.content, ref)
  const search = useRef({ text: '', time: 0 })
  useLayoutEffect(() => {
    search.current = { text: '', time: 0 }
    const node = menu.content.current
    if (!menu.open || !node) return
    const options = items(node)
    focusItem(node, menu.intent.current === 'last' ? options.at(-1) : options[0])
  }, [menu.open, menu.content, menu.intent])
  return (
    <PopoverContent
      {...props}
      ref={host}
      role="menu"
      aria-orientation="vertical"
      aria-labelledby={menu.triggerId}
      tabIndex={-1}
      data-slot={joinIds('menu-content', props['data-slot'])}
      className={cn(
        'w-[var(--rad-menu-width,16rem)] gap-0 p-[var(--rad-menu-padding,0.25rem)] rounded-[var(--rad-menu-radius,var(--rad-surface-radius,0.75rem))]',
        'bg-[var(--rad-menu-background,var(--rad-color-surface,white))] [color:var(--rad-menu-color,var(--rad-color-foreground))] [border-color:var(--rad-menu-border-color,var(--rad-color-border))] [border-width:var(--rad-menu-border-width,var(--rad-surface-border-width,1px))] [border-style:var(--rad-menu-border-style,var(--rad-surface-border-style,solid))] [box-shadow:var(--rad-menu-shadow,var(--rad-surface-overlay-shadow,0_8px_32px_#0003))]',
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
          menu.trigger.current?.focus({ preventScroll: true })
          menu.setOpen(false)
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
export function MenuItem({
  disabled = false,
  textValue,
  onSelect,
  onClick,
  onFocus,
  onPointerMove,
  className,
  motion,
  ...props
}: MenuItemProps) {
  const menu = useMenuContext()
  return (
    <PopoverClose
      {...props}
      disabled={undefined}
      aria-disabled={disabled || undefined}
      role="menuitem"
      tabIndex={-1}
      motion={disabled ? 'off' : motion}
      data-slot={joinIds('menu-item', props['data-slot'])}
      data-text-value={textValue}
      className={cn(
        'h-auto w-full justify-start [background-image:none] inset-shadow-none [border-width:0] [border-style:none] bg-transparent text-start text-inherit shadow-none p-[var(--rad-menu-item-padding,0.625rem)] rounded-[var(--rad-menu-item-radius,var(--rad-control-radius,0.5rem))]',
        'hover:bg-[var(--rad-menu-item-focus-background,color-mix(in_oklab,var(--rad-color-accent)_12%,var(--rad-color-surface)))] focus:bg-[var(--rad-menu-item-focus-background,color-mix(in_oklab,var(--rad-color-accent)_12%,var(--rad-color-surface)))] focus:[color:var(--rad-menu-item-focus-color,color-mix(in_oklab,var(--rad-color-accent)_25%,var(--rad-color-foreground)))]',
        'aria-disabled:cursor-not-allowed aria-disabled:opacity-[var(--rad-state-disabled-opacity,0.5)] forced-colors:aria-disabled:text-[GrayText] forced-colors:aria-disabled:opacity-100 forced-colors:focus:bg-[Highlight] forced-colors:focus:text-[HighlightText]',
        className
      )}
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

'use client'

import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps
} from 'react'
import {
  MenuRoot,
  useMenu,
  useMenuContext,
  useMenuFamily,
  MenuPortal,
  MenuContent,
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
  type MenuProps,
  type MenuState,
  type MenuPortalProps,
  type MenuContentProps,
  type MenuItemProps,
  type MenuGroupProps,
  type MenuLabelProps,
  type MenuSeparatorProps,
  type MenuCheckboxItemProps,
  type MenuRadioGroupProps,
  type MenuRadioItemProps,
  type MenuSubProps,
  type MenuSubTriggerProps,
  type MenuSubContentProps
} from './Menu.js'
import { usePopoverContext } from './Popover.js'
import { requireAccessibleName, type AccessibleName } from './internal/accessibleName.js'
import { joinIds } from './internal/ids.js'
import { cn } from './cn.js'
import { useComposedRefs } from './react/useComposedRefs.js'
import type { ThemeStyle } from './themes/defineTheme.js'

type Point = { x: number; y: number }
export type ContextMenuProps = MenuProps
export type ContextMenuState = MenuState
export type ContextMenuTriggerProps = Omit<
  ComponentProps<'div'>,
  'id' | 'role' | 'aria-haspopup' | 'aria-expanded' | 'aria-controls' | 'style'
> &
  AccessibleName & { style?: ThemeStyle; 'data-slot'?: string }
export type ContextMenuPortalProps = MenuPortalProps
export type ContextMenuContentProps = MenuContentProps
export type ContextMenuItemProps = MenuItemProps
export type ContextMenuGroupProps = MenuGroupProps
export type ContextMenuLabelProps = MenuLabelProps
export type ContextMenuSeparatorProps = MenuSeparatorProps
export type ContextMenuCheckboxItemProps = MenuCheckboxItemProps
export type ContextMenuRadioGroupProps = MenuRadioGroupProps
export type ContextMenuRadioItemProps = MenuRadioItemProps
export type ContextMenuSubProps = MenuSubProps
export type ContextMenuSubTriggerProps = MenuSubTriggerProps
export type ContextMenuSubContentProps = MenuSubContentProps
const TargetContext = createContext<((point: Point) => void) | null>(null)
export function useContextMenu(): ContextMenuState | null {
  const menu = useMenu(),
    family = useMenuFamily()
  return family === 'context-menu' ? menu : null
}
function useTargetContext() {
  const setPoint = useContext(TargetContext),
    family = useMenuFamily()
  if (!setPoint || family !== 'context-menu')
    throw new Error('ContextMenu parts must render inside ContextMenu.')
  return setPoint
}
export function ContextMenu({ children, ...props }: ContextMenuProps) {
  const [point, setPoint] = useState<Point>()
  return (
    <MenuRoot
      {...props}
      family="context-menu"
      parent={undefined}
      focusIntent={undefined}
      anchorPoint={point}
    >
      <TargetContext.Provider value={setPoint}>{children}</TargetContext.Provider>
    </MenuRoot>
  )
}
/* oxlint-disable jsx-a11y/prefer-tag-over-role, jsx-a11y/no-noninteractive-element-interactions -- A named content group offers native context-menu invocation and a keyboard equivalent, not button activation. */
export function ContextMenuTrigger({
  ref,
  className,
  tabIndex = 0,
  onContextMenu,
  onKeyDown,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onClickCapture,
  ...props
}: ContextMenuTriggerProps) {
  requireAccessibleName('ContextMenuTrigger', props)
  const setPoint = useTargetContext(),
    menu = useMenuContext(),
    popover = usePopoverContext()
  const host = useRef<HTMLDivElement>(null),
    own = useComposedRefs<HTMLDivElement>(popover.setTrigger, host),
    registered = useComposedRefs<HTMLDivElement>(menu.setTrigger, own),
    composed = useComposedRefs(registered, ref)
  const pending = useRef<{
      win: Window
      timer: number
      x: number
      y: number
      pointer: number
    } | null>(null),
    suppressClick = useRef(false)
  const latest = useRef({ setPoint, menu })
  useLayoutEffect(() => {
    latest.current = { setPoint, menu }
  })
  const clear = () => {
    if (pending.current) pending.current.win.clearTimeout(pending.current.timer)
    pending.current = null
  }
  useLayoutEffect(
    () => () => {
      if (pending.current) pending.current.win.clearTimeout(pending.current.timer)
    },
    []
  )
  const insideSurface = (target: EventTarget | null) =>
    target instanceof host.current!.ownerDocument.defaultView!.Element &&
    !!target.closest('[role="menu"]')
  const openAt = (point: Point) => {
    latest.current.setPoint(point)
    latest.current.menu.setIntent('first')
    latest.current.menu.setOpen(true)
  }
  return (
    <div
      {...props}
      ref={composed}
      id={menu.triggerId}
      role="group"
      tabIndex={tabIndex}
      aria-haspopup={undefined}
      aria-expanded={undefined}
      data-state={menu.open ? 'open' : 'closed'}
      aria-controls={menu.contentId}
      data-slot={joinIds('context-menu-trigger', props['data-slot'])}
      className={cn(
        'focus-visible:outline-solid focus-visible:[outline-color:var(--rad-color-focus,oklch(0.55_0.13_255))] focus-visible:[outline-width:var(--rad-focus-width,2px)] focus-visible:[outline-offset:var(--rad-focus-offset,2px)] forced-colors:focus-visible:outline-[Highlight]',
        className
      )}
      onContextMenu={event => {
        onContextMenu?.(event)
        if (event.defaultPrevented) return
        if (insideSurface(event.target)) return
        clear()
        event.preventDefault()
        openAt({ x: event.clientX, y: event.clientY })
      }}
      onKeyDown={event => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        if (
          insideSurface(event.target) ||
          event.nativeEvent.isComposing ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          !(event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey))
        )
          return
        event.preventDefault()
        clear()
        const doc = event.currentTarget.ownerDocument,
          focused = doc.activeElement,
          target =
            focused instanceof doc.defaultView!.HTMLElement && event.currentTarget.contains(focused)
              ? focused
              : event.currentTarget,
          rect = target.getBoundingClientRect(),
          rtl = doc.defaultView!.getComputedStyle(target).direction === 'rtl'
        openAt({ x: rtl ? rect.right : rect.left, y: rect.bottom })
      }}
      onPointerDown={event => {
        suppressClick.current = false
        clear()
        onPointerDown?.(event)
        if (
          event.defaultPrevented ||
          event.pointerType !== 'touch' ||
          !event.isPrimary ||
          insideSurface(event.target)
        )
          return
        const win = event.currentTarget.ownerDocument.defaultView!,
          x = event.clientX,
          y = event.clientY,
          pointer = event.pointerId
        pending.current = {
          win,
          x,
          y,
          pointer,
          timer: win.setTimeout(() => {
            pending.current = null
            suppressClick.current = true
            openAt({ x, y })
          }, 500)
        }
      }}
      onPointerMove={event => {
        onPointerMove?.(event)
        const press = pending.current
        if (
          press &&
          event.pointerId === press.pointer &&
          Math.hypot(event.clientX - press.x, event.clientY - press.y) > 10
        )
          clear()
      }}
      onPointerUp={event => {
        onPointerUp?.(event)
        clear()
      }}
      onPointerCancel={event => {
        onPointerCancel?.(event)
        clear()
      }}
      onClickCapture={event => {
        onClickCapture?.(event)
        if (suppressClick.current) {
          suppressClick.current = false
          event.preventDefault()
          event.stopPropagation()
        }
      }}
    />
  )
}
/* oxlint-enable jsx-a11y/prefer-tag-over-role, jsx-a11y/no-noninteractive-element-interactions */
export function ContextMenuPortal(props: ContextMenuPortalProps) {
  useTargetContext()
  return <MenuPortal {...props} />
}
export function ContextMenuContent({ className, ...props }: ContextMenuContentProps) {
  useTargetContext()
  return (
    <MenuContent
      {...props}
      sideOffset={props.sideOffset ?? 0}
      data-slot={joinIds('context-menu-content', props['data-slot'])}
      className={cn('w-[var(--rad-context-menu-width,var(--rad-menu-width,16rem))]', className)}
    />
  )
}
export function ContextMenuItem(props: ContextMenuItemProps) {
  useTargetContext()
  return (
    <MenuItem
      {...props}
      data-slot={joinIds('context-menu-item', props['data-slot'])}
    />
  )
}
export function ContextMenuGroup(props: ContextMenuGroupProps) {
  useTargetContext()
  return (
    <MenuGroup
      {...props}
      data-slot={joinIds('context-menu-group', props['data-slot'])}
    />
  )
}
export function ContextMenuLabel(props: ContextMenuLabelProps) {
  useTargetContext()
  return (
    <MenuLabel
      {...props}
      data-slot={joinIds('context-menu-label', props['data-slot'])}
    />
  )
}
export function ContextMenuSeparator(props: ContextMenuSeparatorProps) {
  useTargetContext()
  return (
    <MenuSeparator
      {...props}
      data-slot={joinIds('context-menu-separator', props['data-slot'])}
    />
  )
}
export function ContextMenuCheckboxItem(props: ContextMenuCheckboxItemProps) {
  useTargetContext()
  return (
    <MenuCheckboxItem
      {...props}
      data-slot={joinIds('context-menu-checkbox-item', props['data-slot'])}
    />
  )
}
export function ContextMenuRadioGroup(props: ContextMenuRadioGroupProps) {
  useTargetContext()
  return (
    <MenuRadioGroup
      {...props}
      data-slot={joinIds('context-menu-radio-group', props['data-slot'])}
    />
  )
}
export function ContextMenuRadioItem(props: ContextMenuRadioItemProps) {
  useTargetContext()
  return (
    <MenuRadioItem
      {...props}
      data-slot={joinIds('context-menu-radio-item', props['data-slot'])}
    />
  )
}
export function ContextMenuSub(props: ContextMenuSubProps) {
  useTargetContext()
  return <MenuSub {...props} />
}
export function ContextMenuSubTrigger(props: ContextMenuSubTriggerProps) {
  useTargetContext()
  return (
    <MenuSubTrigger
      {...props}
      data-slot={joinIds('context-menu-sub-trigger', props['data-slot'])}
    />
  )
}
export function ContextMenuSubContent({ className, ...props }: ContextMenuSubContentProps) {
  useTargetContext()
  return (
    <MenuSubContent
      {...props}
      data-slot={joinIds('context-menu-sub-content', props['data-slot'])}
      className={cn('w-[var(--rad-context-menu-width,var(--rad-menu-width,16rem))]', className)}
    />
  )
}

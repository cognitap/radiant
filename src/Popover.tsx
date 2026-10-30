'use client'

import {
  createContext,
  useContext,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type RefObject
} from 'react'
import { createPortal } from 'react-dom'
import { Button, type ButtonProps, type ButtonRenderProps } from './Button.js'
import { cn } from './cn.js'
import { composeAction } from './internal/events.js'
import { joinIds } from './internal/ids.js'
import type { PopoverSide, PopoverAlign } from './internal/popover.js'
import { useControllableState } from './react/useControllableState.js'
import { useComposedRefs } from './react/useComposedRefs.js'
import { usePopoverSurface } from './react/usePopoverSurface.js'
import { useTransitionHost } from './motion/host.js'
import type { ThemeStyle } from './themes/defineTheme.js'

export type { PopoverSide, PopoverAlign } from './internal/popover.js'
export type PopoverProps = (
  | { open: boolean; defaultOpen?: never }
  | { open?: undefined; defaultOpen?: boolean }
) & {
  onOpenChange?: (open: boolean) => void
  children?: ReactNode
}
export type PopoverState = { open: boolean; setOpen: (open: boolean) => void; contentId: string }
type Context = PopoverState & {
  trigger: HTMLElement | null
  setTrigger: (node: HTMLElement | null) => void
  content: RefObject<HTMLDivElement | null>
  restoreFocus: RefObject<boolean>
  close: (restore: boolean) => void
}
const PopoverContext = createContext<Context | null>(null)
export function usePopover(): PopoverState | null {
  return useContext(PopoverContext)
}
/** Private native-anchor seam for composed surface families; absent from package exports. */
export function usePopoverContext() {
  const value = useContext(PopoverContext)
  if (!value) throw new Error('Popover parts must render inside Popover.')
  return value
}
export function Popover({ open, defaultOpen, onOpenChange, children }: PopoverProps) {
  const state = useControllableState({
    name: 'Popover',
    value: open,
    defaultValue: defaultOpen,
    initialValue: false,
    onChange: onOpenChange
  })
  const contentId = useId()
  const [trigger, setTrigger] = useState<HTMLElement | null>(null)
  const content = useRef<HTMLDivElement>(null)
  const restoreFocus = useRef(true)
  const setOpen = (next: boolean) => {
    restoreFocus.current = true
    state.request(next)
  }
  const close = (restore: boolean) => {
    restoreFocus.current = restore
    state.request(false)
  }
  return (
    <PopoverContext.Provider
      value={{
        open: state.value,
        setOpen,
        contentId,
        trigger,
        setTrigger,
        content,
        restoreFocus,
        close
      }}
    >
      {children}
    </PopoverContext.Provider>
  )
}

export type PopoverTriggerProps = ButtonProps
export type PopoverCloseProps = ButtonProps
export type PopoverRenderProps = ButtonRenderProps
export type PopoverPortalProps = { children?: ReactNode }
export type PopoverContentProps = Omit<ComponentProps<'div'>, 'style' | 'popover' | 'id'> & {
  style?: ThemeStyle
  'data-slot'?: string
  side?: PopoverSide
  align?: PopoverAlign
  sideOffset?: number
  collisionPadding?: number
  /** Keep focus on the opener by default; optionally focus a descendant on each open. */
  initialFocusRef?: RefObject<HTMLElement | null>
  motion?: 'inherit' | 'off'
}

export function PopoverTrigger({ ref, onClick, ...props }: PopoverTriggerProps) {
  const popover = usePopoverContext()
  const hostRef = useComposedRefs<HTMLButtonElement>(popover.setTrigger, ref)
  return (
    <Button
      {...props}
      ref={hostRef}
      popoverTarget={undefined}
      popoverTargetAction={undefined}
      aria-controls={popover.contentId}
      aria-expanded={popover.open}
      data-slot={joinIds('popover-trigger', props['data-slot'])}
      onClick={composeAction(onClick, () => popover.setOpen(!popover.open))}
    />
  )
}
export function PopoverClose({ onClick, ...props }: PopoverCloseProps) {
  const popover = usePopoverContext()
  return (
    <Button
      {...props}
      popoverTarget={undefined}
      popoverTargetAction={undefined}
      data-slot={joinIds('popover-close', props['data-slot'])}
      onClick={composeAction(onClick, () => popover.close(true))}
    />
  )
}
/** The local portal preserves theme, native form ownership and modal ancestry. */
export function PopoverPortal({ children }: PopoverPortalProps) {
  const popover = usePopoverContext()
  // Rich surfaces cannot be inserted into a link's phrasing-only parent (p, span, label).
  const container = popover.trigger?.parentElement?.closest<HTMLElement>(
    'div, section, article, aside, main, nav, form, dialog, [popover], li, dd, td, th, fieldset, figure, body'
  )
  return container ? createPortal(children, container) : null
}

const surfaceClass = [
  'fixed right-auto bottom-auto m-0 box-border min-w-0 overflow-auto overscroll-contain text-start antialiased',
  '[&:not(:popover-open)]:hidden',
  'left-[var(--_rad-popover-left,0px)] top-[var(--_rad-popover-top,0px)] w-[var(--rad-popover-width,20rem)] max-w-[var(--_rad-popover-max-width,calc(100vw-1rem))] max-h-[var(--_rad-popover-max-height,calc(100dvh-1rem))]',
  'grid gap-[var(--rad-popover-gap,var(--rad-surface-gap,1rem))] p-[var(--rad-popover-padding,var(--rad-surface-padding,1.5rem))]',
  'rounded-[var(--rad-popover-radius,var(--rad-surface-radius,0.75rem))] [corner-shape:var(--rad-popover-corner-shape,var(--rad-surface-corner-shape,round))]',
  '[border-width:var(--rad-popover-border-width,var(--rad-surface-border-width,1px))] [border-style:var(--rad-popover-border-style,var(--rad-surface-border-style,solid))] [border-color:var(--rad-popover-border-color,var(--rad-color-border))]',
  'bg-[var(--rad-popover-background,var(--rad-color-surface,white))] [color:var(--rad-popover-color,var(--rad-color-foreground))] [box-shadow:var(--rad-popover-shadow,var(--rad-surface-overlay-shadow,0_8px_32px_#0003))] [backdrop-filter:var(--rad-popover-backdrop-filter,none)]',
  'font-[family-name:var(--rad-typography-roles-ui-body-family,system-ui,sans-serif)] text-[length:var(--rad-typography-roles-ui-body-size,0.875rem)] font-[number:var(--rad-typography-roles-ui-body-weight,400)] leading-[var(--rad-typography-roles-ui-body-line-height,1.5)] tracking-[var(--rad-typography-roles-ui-body-letter-spacing,-0.011em)]',
  'focus-visible:outline-solid focus-visible:[outline-color:var(--rad-popover-focus-color,var(--rad-color-focus))] focus-visible:[outline-width:var(--rad-popover-focus-width,var(--rad-focus-width,2px))] focus-visible:[outline-offset:var(--rad-popover-focus-offset,var(--rad-focus-offset,2px))] focus-visible:[outline-style:var(--rad-popover-focus-style,var(--rad-focus-style,solid))]',
  'transition-colors duration-[var(--rad-motion-color-duration,150ms)] motion-reduce:transition-none',
  'forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]'
].join(' ')

export function PopoverContent(props: PopoverContentProps) {
  return (
    <PopoverContentRoot
      {...props}
      onFocusOutside={undefined}
    />
  )
}
/** Private focus-leave timing seam; native pointer/Escape dismissal stays shared. */
export function PopoverContentRoot({
  onFocusOutside,
  ref,
  className,
  side = 'bottom',
  align = 'start',
  sideOffset = 8,
  collisionPadding = 8,
  initialFocusRef,
  motion = 'inherit',
  ...props
}: PopoverContentProps & { onFocusOutside?: () => void }) {
  const popover = usePopoverContext()
  if (![sideOffset, collisionPadding].every(value => Number.isFinite(value) && value >= 0))
    throw new TypeError('Popover offsets and padding must be finite, nonnegative numbers.')
  const hostRef = useComposedRefs(popover.content, ref)
  const {
    ref: transitionRef,
    active: motionActive,
    off: motionOff
  } = useTransitionHost('popup', hostRef, motion === 'off')
  usePopoverSurface(
    popover.content,
    popover.trigger,
    popover.open,
    popover.close,
    popover.restoreFocus,
    { side, align, sideOffset, collisionPadding, initialFocusRef, onFocusOutside }
  )
  return (
    <div
      {...props}
      ref={transitionRef}
      id={popover.contentId}
      popover="manual"
      data-slot={joinIds('popover-content', props['data-slot'])}
      data-state={popover.open ? 'open' : 'closed'}
      data-side={side}
      data-align={align}
      data-motion={motion}
      className={cn(
        surfaceClass,
        motionActive &&
          !motionOff &&
          'opacity-[var(--_rad-popup-enter,0)] motion-reduce:opacity-100',
        className
      )}
    />
  )
}

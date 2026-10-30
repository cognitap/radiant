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
import { joinIds } from './internal/ids.js'
import { composeAction } from './internal/events.js'
import type { PopoverSide, PopoverAlign } from './internal/popover.js'
import { useControllableState } from './react/useControllableState.js'
import { useComposedRefs } from './react/useComposedRefs.js'
import { useHoverSurface } from './react/useHoverSurface.js'
import { usePopoverSurface } from './react/usePopoverSurface.js'
import { useTransitionHost } from './motion/host.js'
import type { ThemeStyle } from './themes/defineTheme.js'

export type TooltipProps = (
  | { open: boolean; defaultOpen?: never }
  | { open?: undefined; defaultOpen?: boolean }
) & {
  onOpenChange?: (open: boolean) => void
  openDelay?: number
  closeDelay?: number
  children?: ReactNode
}
export type TooltipState = { open: boolean; setOpen: (open: boolean) => void; contentId: string }
type Context = TooltipState & {
  trigger: HTMLButtonElement | null
  setTrigger: (node: HTMLButtonElement | null) => void
  content: RefObject<HTMLSpanElement | null>
  enter: (focus?: boolean) => void
  leave: (focus?: boolean) => void
  dismiss: () => void
  touch: () => void
}
const TooltipContext = createContext<Context | null>(null)
export function useTooltip(): TooltipState | null {
  return useContext(TooltipContext)
}
function useTooltipContext() {
  const value = useContext(TooltipContext)
  if (!value) throw new Error('Tooltip parts must render inside Tooltip.')
  return value
}

export function Tooltip({
  open,
  defaultOpen,
  onOpenChange,
  openDelay = 500,
  closeDelay = 150,
  children
}: TooltipProps) {
  if (![openDelay, closeDelay].every(n => Number.isFinite(n) && n >= 0))
    throw new TypeError('Tooltip delays must be finite, nonnegative numbers.')
  const state = useControllableState({
    name: 'Tooltip',
    value: open,
    defaultValue: defaultOpen,
    initialValue: false,
    onChange: onOpenChange
  })
  const contentId = useId()
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null)
  const content = useRef<HTMLSpanElement>(null)
  const { enter, leave, dismiss, touch } = useHoverSurface({
    trigger,
    content,
    open: state.value,
    request: state.request,
    openDelay,
    closeDelay
  })
  return (
    <TooltipContext.Provider
      value={{
        open: state.value,
        setOpen: state.request,
        contentId,
        trigger,
        setTrigger,
        content,
        enter,
        leave,
        dismiss,
        touch
      }}
    >
      {children}
    </TooltipContext.Provider>
  )
}

export type TooltipTriggerProps = ButtonProps
export type TooltipRenderProps = ButtonRenderProps
export type TooltipPortalProps = { children?: ReactNode }
export type TooltipContentProps = Omit<
  ComponentProps<'span'>,
  'style' | 'id' | 'role' | 'popover' | 'tabIndex'
> & {
  style?: ThemeStyle
  side?: PopoverSide
  align?: PopoverAlign
  sideOffset?: number
  collisionPadding?: number
  motion?: 'inherit' | 'off'
}
export function TooltipTrigger({
  ref,
  onClick,
  onFocus,
  onBlur,
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  ...props
}: TooltipTriggerProps) {
  const tip = useTooltipContext()
  const hostRef = useComposedRefs(tip.setTrigger, ref)
  return (
    <Button
      {...props}
      ref={hostRef}
      data-slot={joinIds('tooltip-trigger', props['data-slot'])}
      aria-describedby={joinIds(tip.contentId, props['aria-describedby'])}
      onFocus={event => {
        onFocus?.(event)
        tip.enter(true)
      }}
      onBlur={event => {
        onBlur?.(event)
        tip.leave(true)
      }}
      onPointerEnter={composeAction(onPointerEnter, event => {
        if (event.pointerType !== 'touch') tip.enter()
      })}
      onPointerLeave={composeAction(onPointerLeave, event => {
        if (event.pointerType !== 'touch') tip.leave()
      })}
      onPointerDown={event => {
        onPointerDown?.(event)
        if (event.pointerType === 'touch') tip.touch()
      }}
      onClick={composeAction(onClick, tip.dismiss)}
    />
  )
}
export function TooltipPortal({ children }: TooltipPortalProps) {
  const tip = useTooltipContext()
  return tip.trigger?.parentElement ? createPortal(children, tip.trigger.parentElement) : children
}
export function TooltipContent({
  ref,
  className,
  side = 'top',
  align = 'center',
  sideOffset = 8,
  collisionPadding = 8,
  motion = 'inherit',
  onPointerEnter,
  onPointerLeave,
  ...props
}: TooltipContentProps) {
  const tip = useTooltipContext()
  if (![sideOffset, collisionPadding].every(n => Number.isFinite(n) && n >= 0))
    throw new TypeError('Tooltip offsets must be finite, nonnegative numbers.')
  const hostRef = useComposedRefs(tip.content, ref)
  const restoreFocus = useRef(false)
  const { ref: transitionRef, active, off } = useTransitionHost('popup', hostRef, motion === 'off')
  usePopoverSurface(tip.content, tip.trigger, tip.open, tip.dismiss, restoreFocus, {
    side,
    align,
    sideOffset,
    collisionPadding
  })
  return (
    <span
      {...props}
      ref={transitionRef}
      id={tip.contentId}
      role="tooltip"
      popover="manual"
      tabIndex={undefined}
      data-slot="tooltip-content"
      data-state={tip.open ? 'open' : 'closed'}
      data-side={side}
      data-align={align}
      data-motion={motion}
      onPointerEnter={composeAction(onPointerEnter, event => {
        if (event.pointerType !== 'touch') tip.enter()
      })}
      onPointerLeave={composeAction(onPointerLeave, event => {
        if (event.pointerType !== 'touch') tip.leave()
      })}
      className={cn(
        'fixed right-auto bottom-auto m-0 box-border block min-w-0 w-max overflow-auto break-words text-start antialiased [&:not(:popover-open)]:hidden',
        'left-[var(--_rad-popover-left,0px)] top-[var(--_rad-popover-top,0px)] max-w-[min(var(--rad-tooltip-max-width,20rem),var(--_rad-popover-max-width,calc(100vw-1rem)))] max-h-[var(--_rad-popover-max-height,calc(100dvh-1rem))]',
        'p-[var(--rad-tooltip-padding,0.625rem)] rounded-[var(--rad-tooltip-radius,var(--rad-control-radius,0.5rem))]',
        'bg-[var(--rad-tooltip-background,var(--rad-color-surface,white))] [color:var(--rad-tooltip-color,var(--rad-color-foreground))] [border-color:var(--rad-tooltip-border-color,var(--rad-color-border))] [border-width:var(--rad-tooltip-border-width,var(--rad-surface-border-width,1px))] [border-style:var(--rad-tooltip-border-style,var(--rad-surface-border-style,solid))] [box-shadow:var(--rad-tooltip-shadow,var(--rad-surface-overlay-shadow,0_8px_32px_#0003))]',
        'font-[family-name:var(--rad-typography-roles-ui-supporting-family,system-ui,sans-serif)] text-[length:var(--rad-tooltip-font-size,var(--rad-typography-roles-ui-supporting-size,0.8125rem))] font-[number:var(--rad-tooltip-font-weight,var(--rad-typography-roles-ui-supporting-weight,400))] leading-[var(--rad-typography-roles-ui-supporting-line-height,1.5)]',
        'forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]',
        active && !off && 'opacity-[var(--_rad-popup-enter,0)] motion-reduce:opacity-100',
        className
      )}
    />
  )
}

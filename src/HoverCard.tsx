'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { Link, type LinkProps, type LinkRenderProps } from './Link.js'
import {
  Popover,
  PopoverPortal,
  PopoverContentRoot,
  usePopoverContext,
  type PopoverProps,
  type PopoverState,
  type PopoverContentProps
} from './Popover.js'
import { useComposedRefs } from './react/useComposedRefs.js'
import { useHoverSurface } from './react/useHoverSurface.js'
import { composeAction } from './internal/events.js'
import { joinIds } from './internal/ids.js'
import { cn } from './cn.js'

export type HoverCardProps = PopoverProps & { openDelay?: number; closeDelay?: number }
export type HoverCardState = PopoverState
export type HoverCardRenderProps = Omit<LinkRenderProps, 'data-slot'> & { 'data-slot': string }
export type HoverCardTriggerProps = Omit<
  LinkProps,
  'href' | 'render' | 'aria-controls' | 'aria-expanded'
> & {
  href: string
  render?: (props: HoverCardRenderProps) => ReturnType<NonNullable<LinkProps['render']>>
  'data-slot'?: string
}
export type HoverCardContentProps = Omit<PopoverContentProps, 'initialFocusRef'>
export type HoverCardPortalProps = { children?: ReactNode }
type Context = ReturnType<typeof usePopoverContext> & ReturnType<typeof useHoverSurface>
const HoverCardContext = createContext<Context | null>(null)
export function useHoverCard(): HoverCardState | null {
  return useContext(HoverCardContext)
}
function useHoverCardContext() {
  const card = useContext(HoverCardContext)
  if (!card) throw new Error('HoverCard parts must render inside HoverCard.')
  return card
}
export function HoverCard({
  openDelay = 500,
  closeDelay = 150,
  children,
  ...props
}: HoverCardProps) {
  if (![openDelay, closeDelay].every(n => Number.isFinite(n) && n >= 0))
    throw new TypeError('HoverCard delays must be finite, nonnegative numbers.')
  return (
    <Popover {...props}>
      <HoverCardOwner
        openDelay={openDelay}
        closeDelay={closeDelay}
      >
        {children}
      </HoverCardOwner>
    </Popover>
  )
}
function HoverCardOwner({
  children,
  openDelay,
  closeDelay
}: {
  children?: ReactNode
  openDelay: number
  closeDelay: number
}) {
  const card = usePopoverContext()
  const hover = useHoverSurface({
    trigger: card.trigger,
    content: card.content,
    open: card.open,
    request: card.setOpen,
    openDelay,
    focusDelay: openDelay,
    closeDelay
  })
  return (
    <HoverCardContext.Provider value={{ ...card, ...hover }}>{children}</HoverCardContext.Provider>
  )
}
export function HoverCardTrigger({
  ref,
  render,
  onFocus,
  onBlur,
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  onClick,
  ...props
}: HoverCardTriggerProps) {
  if (typeof props.href !== 'string')
    throw new TypeError('HoverCardTrigger requires a navigation href.')
  const card = useHoverCardContext(),
    host = useComposedRefs<HTMLAnchorElement>(card.setTrigger, ref)
  return (
    <Link
      {...props}
      ref={host}
      aria-controls={card.contentId}
      aria-expanded={card.open}
      render={resolved => {
        const scoped: HoverCardRenderProps = {
          ...resolved,
          'data-slot':
            joinIds('link', 'hover-card-trigger', props['data-slot']) ?? 'link hover-card-trigger'
        }
        return render ? render(scoped) : <a {...scoped}>{scoped.children}</a>
      }}
      onFocus={composeAction(onFocus, () => card.enter(true))}
      onBlur={event => {
        onBlur?.(event)
        const next = event.relatedTarget
        if (
          next instanceof event.currentTarget.ownerDocument.defaultView!.Node &&
          card.content.current?.contains(next)
        )
          return
        card.leave(true)
      }}
      onPointerEnter={composeAction(onPointerEnter, event => {
        if (event.pointerType !== 'touch') card.enter()
      })}
      onPointerLeave={composeAction(onPointerLeave, event => {
        if (event.pointerType !== 'touch') card.leave()
      })}
      onPointerDown={event => {
        onPointerDown?.(event)
        if (event.pointerType === 'touch') card.touch()
      }}
      onClick={composeAction(onClick, card.dismiss)}
    />
  )
}
export function HoverCardPortal(props: HoverCardPortalProps) {
  useHoverCardContext()
  return <PopoverPortal {...props} />
}
export function HoverCardContent({
  className,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  ...props
}: HoverCardContentProps) {
  const card = useHoverCardContext()
  return (
    <PopoverContentRoot
      onFocusOutside={() => card.leave(true)}
      {...props}
      initialFocusRef={undefined}
      data-slot={joinIds('hover-card-content', props['data-slot'])}
      className={cn('w-[var(--rad-hover-card-width,var(--rad-popover-width,20rem))]', className)}
      onPointerEnter={composeAction(onPointerEnter, event => {
        if (event.pointerType !== 'touch') card.enter()
      })}
      onPointerLeave={composeAction(onPointerLeave, event => {
        if (event.pointerType !== 'touch') card.leave()
      })}
      onFocus={composeAction(onFocus, () => card.enter(true))}
      onBlur={event => {
        onBlur?.(event)
        const next = event.relatedTarget,
          node = event.currentTarget
        if (
          next instanceof node.ownerDocument.defaultView!.Node &&
          (node.contains(next) || card.trigger?.contains(next))
        )
          return
        card.leave(true)
      }}
    />
  )
}

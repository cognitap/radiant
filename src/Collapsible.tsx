'use client'

import type { ComponentProps, CSSProperties, ToggleEvent } from 'react'
import { createContext, useContext, useId } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from './cn.js'
import { joinIds } from './internal/ids.js'
import type { ThemeStyle } from './themes/defineTheme.js'
import { useControllableState } from './react/useControllableState.js'
import { flattenComponents, type ThemeComponentOverrides } from './themes/components.js'

const colorMotionClass =
  'transition-colors duration-[var(--rad-motion-color-duration,150ms)] motion-reduce:transition-none'

const collapsibleVariants = cva([
  colorMotionClass,
  '[font-family:var(--rad-typography-family,system-ui,sans-serif)] [letter-spacing:var(--rad-typography-letter-spacing,-0.011em)] [font-size:var(--rad-typography-body-size,0.875rem)] [font-weight:var(--rad-typography-body-weight,400)]',
  'group box-border grid w-full gap-[var(--rad-collapsible-gap,var(--rad-surface-gap,1rem))] text-start antialiased',
  'rounded-[var(--rad-collapsible-radius,var(--rad-surface-radius,0.75rem))]',
  '[corner-shape:var(--rad-collapsible-corner-shape,var(--rad-surface-corner-shape,round))]',
  '[border-width:var(--rad-collapsible-border-width,var(--rad-surface-border-width,1px))]',
  '[border-style:var(--rad-collapsible-border-style,var(--rad-surface-border-style,solid))]',
  '[border-color:var(--rad-collapsible-border-color,var(--rad-color-border,oklch(0.885_0.005_286)))]',
  'bg-[var(--rad-collapsible-background,var(--rad-color-surface,oklch(1_0_0)))]',
  '[color:var(--rad-collapsible-color,var(--rad-color-foreground,oklch(0.21_0.006_286)))]',
  '[&::details-content]:overflow-hidden',
  '[&::details-content]:[interpolate-size:allow-keywords]',
  '[&::details-content]:transition-[height]',
  '[&::details-content]:duration-[var(--rad-collapsible-duration,var(--rad-motion-disclosure-duration,150ms))]',
  '[&::details-content]:ease-out',
  '[&:not([open])::details-content]:h-0',
  'open:[&::details-content]:h-auto',
  'motion-reduce:[&::details-content]:transition-none',
  'forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]'
])

const collapsibleTriggerVariants = cva([
  colorMotionClass,
  'flex w-full cursor-pointer items-center gap-[var(--rad-collapsible-gap,var(--rad-surface-gap,1rem))]',
  'list-none p-[var(--rad-collapsible-padding,var(--rad-surface-padding,1.5rem))]',
  '[&::-webkit-details-marker]:hidden [&::marker]:content-none',
  'focus-visible:rounded-[var(--rad-collapsible-radius,var(--rad-surface-radius,0.75rem))]',
  'focus-visible:[corner-shape:var(--rad-collapsible-corner-shape,var(--rad-surface-corner-shape,round))]',
  'focus-visible:outline-solid',
  'focus-visible:[outline-color:var(--rad-collapsible-focus-color,var(--rad-color-focus,oklch(0.55_0.13_255)))]',
  'focus-visible:[outline-width:var(--rad-collapsible-focus-width,var(--rad-focus-width,2px))]',
  'focus-visible:[outline-offset:var(--rad-collapsible-focus-offset,var(--rad-focus-offset,2px))]',
  'focus-visible:[outline-style:var(--rad-collapsible-focus-style,var(--rad-focus-style,solid))]',
  'forced-colors:text-[CanvasText]'
])

const collapsibleMarkerVariants = cva([
  'size-4 shrink-0',
  'transition-transform duration-[var(--rad-collapsible-duration,var(--rad-motion-disclosure-duration,150ms))] ease-out',
  '[details[open]>summary>&]:rotate-90',
  'motion-reduce:transition-none'
])

const collapsibleContentVariants = cva([
  colorMotionClass,
  'min-w-0 px-[var(--rad-collapsible-padding,var(--rad-surface-padding,1.5rem))] pb-[var(--rad-collapsible-padding,var(--rad-surface-padding,1.5rem))]',
  '[color:var(--rad-collapsible-content-color,var(--rad-color-foreground,oklch(0.21_0.006_286)))]',
  '[font-size:var(--rad-collapsible-content-size,var(--rad-typography-body-size,0.875rem))]',
  'forced-colors:text-[CanvasText]'
])

export type CollapsibleProps = Omit<ComponentProps<'details'>, 'open' | 'onToggle' | 'style'> &
  ({ open: boolean; defaultOpen?: never } | { open?: undefined; defaultOpen?: boolean }) & {
    style?: ThemeStyle
    'data-slot'?: string
    onOpenChange?: (open: boolean) => void
    onToggle?: (event: ToggleEvent<HTMLDetailsElement>) => void
  }

export type CollapsibleState = {
  open: boolean
  contentId: string
  setOpen: (open: boolean) => void
}

export type CollapsibleTriggerProps = Omit<ComponentProps<'summary'>, 'style'> & {
  style?: ThemeStyle
  'data-slot'?: string
}

export type CollapsibleContentProps = Omit<ComponentProps<'div'>, 'style'> & {
  style?: ThemeStyle
  'data-slot'?: string
}

export type CollapsibleTheme = NonNullable<ThemeComponentOverrides['collapsible']>

const CollapsibleContext = createContext<CollapsibleState | null>(null)

export function collapsibleTheme(theme: CollapsibleTheme): CSSProperties {
  return flattenComponents({ collapsible: theme }) as CSSProperties
}

export function useCollapsible(): CollapsibleState | null {
  return useContext(CollapsibleContext)
}

function useCollapsibleContext() {
  const collapsible = useCollapsible()
  if (!collapsible) throw new Error('Collapsible parts must render inside Collapsible.')
  return collapsible
}

export function Collapsible({
  open,
  defaultOpen,
  onOpenChange,
  onToggle,
  className,
  children,
  ...props
}: CollapsibleProps) {
  const contentId = useId()
  const {
    value: isOpen,
    request: setOpen,
    controlled
  } = useControllableState({
    name: 'Collapsible',
    value: open,
    defaultValue: defaultOpen,
    initialValue: false,
    onChange: onOpenChange
  })

  return (
    <CollapsibleContext.Provider value={{ open: isOpen, contentId, setOpen }}>
      <details
        {...props}
        className={cn(collapsibleVariants(), className)}
        data-slot={joinIds('collapsible', props['data-slot'])}
        data-state={isOpen ? 'open' : 'closed'}
        open={isOpen}
        onToggle={event => {
          // Native observations may follow prop synchronisation or restoration.
          // Only a difference from owned state constitutes a semantic request.
          if (event.target !== event.currentTarget) return
          onToggle?.(event)
          const next = event.currentTarget.open
          setOpen(next)
          if (controlled && next !== isOpen) event.currentTarget.open = isOpen
        }}
      >
        {children}
      </details>
    </CollapsibleContext.Provider>
  )
}

export function CollapsibleTrigger({ className, children, ...props }: CollapsibleTriggerProps) {
  const collapsible = useCollapsibleContext()
  return (
    <summary
      {...props}
      className={cn(collapsibleTriggerVariants(), className)}
      data-slot={joinIds('collapsible-trigger', props['data-slot'])}
      data-state={collapsible.open ? 'open' : 'closed'}
    >
      <Marker />
      {children}
    </summary>
  )
}

export function CollapsibleContent({ className, ...props }: CollapsibleContentProps) {
  const collapsible = useCollapsibleContext()
  return (
    <div
      {...props}
      className={cn(collapsibleContentVariants(), className)}
      data-slot={joinIds('collapsible-content', props['data-slot'])}
      data-state={collapsible.open ? 'open' : 'closed'}
      id={collapsible.contentId}
    />
  )
}

function Marker() {
  return (
    <svg
      aria-hidden="true"
      className={collapsibleMarkerVariants()}
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M6 4.5 10 8l-4 3.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  )
}

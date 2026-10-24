'use client'

import type { ComponentProps, CSSProperties, ToggleEvent } from 'react'
import { createContext, useContext, useId, useRef, useState } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from './cn.js'

const collapsibleVariants = cva([
  'group box-border grid w-full gap-[var(--collapsible-gap,0.75rem)] text-start antialiased',
  'rounded-[var(--collapsible-radius,var(--button-radius,0.75rem))]',
  '[corner-shape:var(--collapsible-corner-shape,var(--button-corner-shape,unset))]',
  '[border-width:var(--collapsible-border-width,1px)]',
  '[border-style:var(--collapsible-border-style,solid)]',
  '[border-color:var(--collapsible-border-color,var(--color-border))]',
  'bg-[var(--collapsible-background,var(--color-background))]',
  '[color:var(--collapsible-color,var(--color-foreground))]',
  '[&::details-content]:overflow-hidden',
  '[&::details-content]:[interpolate-size:allow-keywords]',
  '[&::details-content]:transition-[height]',
  '[&::details-content]:duration-[var(--collapsible-duration,200ms)]',
  '[&::details-content]:ease-out',
  '[&:not([open])::details-content]:h-0',
  'open:[&::details-content]:h-auto',
  'motion-reduce:[&::details-content]:transition-none',
  'forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]'
])

const collapsibleTriggerVariants = cva([
  'flex w-full cursor-pointer items-center gap-[var(--collapsible-gap,0.75rem)]',
  'list-none p-[var(--collapsible-padding,1rem)]',
  '[&::-webkit-details-marker]:hidden [&::marker]:content-none',
  'focus-visible:outline-solid',
  'focus-visible:[outline-color:var(--collapsible-focus-color,var(--color-focus))]',
  'focus-visible:[outline-width:var(--collapsible-focus-width,2px)]',
  'focus-visible:[outline-offset:var(--collapsible-focus-offset,2px)]',
  'focus-visible:[outline-style:var(--collapsible-focus-style,solid)]',
  'forced-colors:text-[CanvasText]'
])

const collapsibleMarkerVariants = cva([
  'size-4 shrink-0',
  'transition-transform duration-[var(--collapsible-duration,200ms)] ease-out',
  'group-open:rotate-90',
  'motion-reduce:transition-none'
])

const collapsibleContentVariants = cva([
  'min-w-0 px-[var(--collapsible-padding,1rem)] pb-[var(--collapsible-padding,1rem)]',
  '[color:var(--collapsible-content-color,var(--color-foreground))]',
  '[font-size:var(--collapsible-content-size,0.875rem)]',
  'forced-colors:text-[CanvasText]'
])

export type CollapsibleProps = Omit<ComponentProps<'details'>, 'open' | 'onToggle'> & {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onToggle?: (event: ToggleEvent<HTMLDetailsElement>) => void
}

export type CollapsibleState = {
  open: boolean
  contentId: string
  setOpen: (open: boolean) => void
}

export type CollapsibleTriggerProps = ComponentProps<'summary'>

export type CollapsibleContentProps = ComponentProps<'div'>

export type CollapsibleTheme = {
  radius?: string
  cornerShape?: string
  background?: string
  color?: string
  borderWidth?: string
  borderStyle?: string
  borderColor?: string
  padding?: string
  gap?: string
  contentColor?: string
  contentSize?: string
  duration?: string
  focusColor?: string
  focusWidth?: string
  focusOffset?: string
  focusStyle?: string
}

const collapsibleThemeVariables: Record<keyof CollapsibleTheme, string> = {
  radius: '--collapsible-radius',
  cornerShape: '--collapsible-corner-shape',
  background: '--collapsible-background',
  color: '--collapsible-color',
  borderWidth: '--collapsible-border-width',
  borderStyle: '--collapsible-border-style',
  borderColor: '--collapsible-border-color',
  padding: '--collapsible-padding',
  gap: '--collapsible-gap',
  contentColor: '--collapsible-content-color',
  contentSize: '--collapsible-content-size',
  duration: '--collapsible-duration',
  focusColor: '--collapsible-focus-color',
  focusWidth: '--collapsible-focus-width',
  focusOffset: '--collapsible-focus-offset',
  focusStyle: '--collapsible-focus-style'
}

const CollapsibleContext = createContext<CollapsibleState | null>(null)

export function collapsibleTheme(theme: CollapsibleTheme): CSSProperties {
  const style: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(theme)) {
    if (value !== undefined) {
      style[collapsibleThemeVariables[key as keyof CollapsibleTheme]] = value
    }
  }
  return style as CSSProperties
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
  defaultOpen = false,
  onOpenChange,
  onToggle,
  className,
  children,
  ...props
}: CollapsibleProps) {
  const contentId = useId()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const restoring = useRef(false)
  const controlled = open !== undefined
  const isOpen = controlled ? open : uncontrolledOpen
  const setOpen = (next: boolean) => {
    onOpenChange?.(next)
    if (!controlled) setUncontrolledOpen(next)
  }

  return (
    <CollapsibleContext.Provider value={{ open: isOpen, contentId, setOpen }}>
      <details
        {...props}
        className={cn(collapsibleVariants(), className)}
        data-slot="collapsible"
        data-state={isOpen ? 'open' : 'closed'}
        open={isOpen}
        onToggle={event => {
          // toggle bubbles, and writing open below fires it again.
          if (restoring.current || event.target !== event.currentTarget) return
          onToggle?.(event)
          const next = event.currentTarget.open
          if (!controlled) {
            setUncontrolledOpen(next)
            onOpenChange?.(next)
            return
          }
          onOpenChange?.(next)
          if (next === open) return
          restoring.current = true
          event.currentTarget.open = open
          restoring.current = false
        }}
      >
        {children}
      </details>
    </CollapsibleContext.Provider>
  )
}

export function CollapsibleTrigger({ className, children, ...props }: CollapsibleTriggerProps) {
  useCollapsibleContext()
  return (
    <summary
      {...props}
      className={cn(collapsibleTriggerVariants(), className)}
      data-slot="collapsible-trigger"
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
      data-slot="collapsible-content"
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

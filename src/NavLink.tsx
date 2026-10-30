'use client'

import type { ReactNode } from 'react'
import {
  ComposedLink,
  type ComposedLinkProps,
  type ComposedLinkRenderProps
} from './composedLink.js'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  type CollapsibleProps,
  type CollapsibleTriggerProps,
  type CollapsibleContentProps
} from './Collapsible.js'
import { cn } from './cn.js'
import { controlMetrics } from './controlStyles.js'
import { joinIds } from './internal/ids.js'
import type { ControlSize, PartStyle } from './presentation.js'

type LabelParts = { icon?: PartStyle; label?: PartStyle; description?: PartStyle }
type ContentProps = {
  children: ReactNode
  icon?: ReactNode
  description?: ReactNode
  parts?: LabelParts
}
type ItemProps = ContentProps & { controlSize?: ControlSize }
export type NavLinkRenderProps = ComposedLinkRenderProps
export type NavLinkProps = Omit<
  ComposedLinkProps,
  'children' | 'aria-current' | 'variant' | 'tone'
> &
  ItemProps & { active?: boolean }
export type NavLinkGroupProps = CollapsibleProps
export type NavLinkGroupTriggerProps = Omit<
  CollapsibleTriggerProps,
  'children' | 'role' | 'aria-current' | 'aria-expanded' | 'aria-controls'
> &
  ItemProps
export type NavLinkGroupContentProps = CollapsibleContentProps

const itemClass = [
  'box-border flex w-full min-w-0 items-center text-start no-underline hover:no-underline min-h-[var(--_rad-control-height)]',
  'gap-[var(--rad-nav-link-gap,0.5rem)] px-[var(--rad-nav-link-padding-inline,var(--_rad-control-padding))] py-[var(--rad-nav-link-padding-block,0.375rem)] rounded-[var(--rad-nav-link-radius,var(--rad-control-radius,0.5rem))]',
  'font-[family-name:var(--rad-nav-link-font-family,var(--rad-typography-roles-ui-label-family,system-ui,sans-serif))] text-[length:var(--rad-nav-link-font-size,var(--_rad-control-font-size))] font-[number:var(--rad-nav-link-font-weight,var(--rad-typography-roles-ui-label-weight,550))] leading-[var(--rad-typography-roles-ui-label-line-height,1.4)]',
  '[color:var(--rad-nav-link-color,var(--rad-color-foreground))] hover:[color:var(--rad-nav-link-color,var(--rad-color-foreground))] hover:bg-[var(--rad-nav-link-hover-background,var(--rad-color-neutral))]',
  'focus-visible:outline-solid focus-visible:[outline-color:var(--rad-nav-link-focus-color,var(--rad-color-focus))] focus-visible:[outline-width:var(--rad-nav-link-focus-width,var(--rad-focus-width,2px))] focus-visible:[outline-offset:var(--rad-nav-link-focus-offset,var(--rad-focus-offset,2px))]',
  'forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] forced-colors:hover:bg-[ButtonFace] forced-colors:hover:text-[CanvasText] forced-colors:focus-visible:outline-[Highlight]'
]
function Content({ children, icon, description, parts }: ContentProps) {
  return (
    <>
      {icon !== undefined && icon !== null && icon !== false && (
        <span
          aria-hidden="true"
          data-slot="nav-link-icon"
          className={cn(
            'flex shrink-0 items-center [&_svg]:size-[var(--_rad-control-indicator-size)]',
            parts?.icon?.className
          )}
          style={parts?.icon?.style}
        >
          {icon}
        </span>
      )}
      <span
        data-slot="nav-link-body"
        className="min-w-0 flex-1"
      >
        <span
          data-slot="nav-link-label"
          className={cn('block [overflow-wrap:anywhere]', parts?.label?.className)}
          style={parts?.label?.style}
        >
          {children}
        </span>
        {description !== undefined && description !== null && description !== false && (
          <span
            data-slot="nav-link-description"
            className={cn(
              'block [overflow-wrap:anywhere] font-[family-name:var(--rad-typography-roles-ui-supporting-family,system-ui,sans-serif)] text-[length:var(--rad-nav-link-description-size,var(--rad-typography-roles-ui-supporting-size,0.8125rem))] font-normal leading-[var(--rad-typography-roles-ui-supporting-line-height,1.5)] [color:var(--rad-nav-link-description-color,var(--rad-color-muted-foreground))] forced-colors:[color:inherit]',
              parts?.description?.className
            )}
            style={parts?.description?.style}
          >
            {description}
          </span>
        )}
      </span>
    </>
  )
}
/** A real Link; the consumer's router owns which destination is current. */
export function NavLink({
  active = false,
  controlSize = 'medium',
  icon,
  description,
  parts,
  children,
  className,
  ...props
}: NavLinkProps) {
  if (typeof active !== 'boolean') throw new TypeError('NavLink active must be boolean.')
  return (
    <ComposedLink
      {...props}
      identity="nav-link"
      variant="subtle"
      tone="neutral"
      controlSize={controlSize}
      aria-current={active ? 'page' : undefined}
      className={cn(
        controlMetrics({ controlSize }),
        itemClass,
        'border-s-[3px] border-s-transparent aria-[current=page]:[border-inline-start-color:var(--rad-nav-link-indicator-color,var(--rad-color-accent))] aria-[current=page]:bg-[var(--rad-nav-link-active-background,var(--rad-color-neutral))] aria-[current=page]:[color:var(--rad-nav-link-active-color,var(--rad-color-foreground))] aria-[current=page]:font-semibold',
        'aria-[current=page]:[&_[data-slot=nav-link-description]]:[color:inherit] aria-[current=page]:hover:bg-[var(--rad-nav-link-active-background,var(--rad-color-neutral))] aria-[current=page]:hover:[color:var(--rad-nav-link-active-color,var(--rad-color-foreground))]',
        'forced-colors:aria-[current=page]:[border-inline-start-color:Highlight] forced-colors:aria-[current=page]:bg-[Highlight] forced-colors:aria-[current=page]:text-[HighlightText] forced-colors:aria-[current=page]:hover:bg-[Highlight] forced-colors:aria-[current=page]:hover:text-[HighlightText]',
        className
      )}
    >
      <Content {...{ icon, description, parts, children }} />
    </ComposedLink>
  )
}
/** Disclosure headers stay summaries; destination anchors belong in Content. */
export function NavLinkGroup({ className, 'data-slot': slot, ...props }: NavLinkGroupProps) {
  return (
    <Collapsible
      {...props}
      data-slot={joinIds('nav-link-group', slot)}
      className={cn('gap-0 rounded-none [border-width:0px] bg-transparent', className)}
    />
  )
}
export function NavLinkGroupTrigger({
  controlSize = 'medium',
  icon,
  description,
  parts,
  children,
  className,
  'data-slot': slot,
  ...props
}: NavLinkGroupTriggerProps) {
  const native = {
    ...props,
    role: undefined,
    'aria-current': undefined,
    'aria-expanded': undefined,
    'aria-controls': undefined
  }
  return (
    <CollapsibleTrigger
      {...native}
      data-slot={joinIds('nav-link-group-trigger', slot)}
      data-control-size={controlSize}
      className={cn(
        controlMetrics({ controlSize }),
        itemClass,
        'rtl:[&>svg]:rotate-180 rtl:data-[state=open]:[&>svg]:rotate-90',
        className
      )}
    >
      <Content {...{ icon, description, parts, children }} />
    </CollapsibleTrigger>
  )
}
export function NavLinkGroupContent({
  className,
  'data-slot': slot,
  ...props
}: NavLinkGroupContentProps) {
  return (
    <CollapsibleContent
      {...props}
      data-slot={joinIds('nav-link-group-content', slot)}
      className={cn('px-0 pb-0 ps-[var(--rad-nav-link-indent,1rem)]', className)}
    />
  )
}

import type { ComponentProps } from 'react'
import {
  ComposedLink,
  type ComposedLinkProps,
  type ComposedLinkRenderProps
} from './composedLink.js'
import { cn } from './cn.js'
import { requireAccessibleName } from './internal/accessibleName.js'
import { joinIds } from './internal/ids.js'
import type { ThemeStyle } from './themes/defineTheme.js'
type Part<Host extends 'nav' | 'ol' | 'li' | 'span'> = Omit<
  ComponentProps<Host>,
  'style' | 'role'
> & { style?: ThemeStyle; 'data-slot'?: string }
export type BreadcrumbProps = Part<'nav'>
export type BreadcrumbListProps = Part<'ol'>
export type BreadcrumbItemProps = Part<'li'>
export type BreadcrumbPageProps = Omit<Part<'span'>, 'aria-current'>
export type BreadcrumbSeparatorProps = Omit<Part<'span'>, 'aria-hidden' | 'tabIndex'>
export type BreadcrumbLinkRenderProps = ComposedLinkRenderProps
export type BreadcrumbLinkProps = Omit<ComposedLinkProps, 'aria-current'> & { current?: boolean }
export function Breadcrumb({ className, ...props }: BreadcrumbProps) {
  const labelledBy = props['aria-labelledby']?.trim() || undefined
  const name = {
    'aria-label': props['aria-label'] ?? (labelledBy ? undefined : 'Breadcrumb'),
    'aria-labelledby': labelledBy
  }
  requireAccessibleName('Breadcrumb', name)
  const nativeProps = { ...props, role: undefined }
  return (
    <nav
      {...nativeProps}
      {...name}
      data-slot={joinIds('breadcrumb', props['data-slot'])}
      className={cn(
        'min-w-0 max-w-full text-start [color:var(--rad-breadcrumb-color,var(--rad-color-muted-foreground))] font-[family-name:var(--rad-typography-roles-ui-body-family,system-ui,sans-serif)] text-[length:var(--rad-breadcrumb-font-size,var(--rad-typography-roles-ui-body-size,0.875rem))] leading-[var(--rad-typography-roles-ui-body-line-height,1.5)]',
        className
      )}
    />
  )
}
export function BreadcrumbList({ className, ...props }: BreadcrumbListProps) {
  const nativeProps = { ...props, role: undefined }
  return (
    <ol
      {...nativeProps}
      data-slot={joinIds('breadcrumb-list', props['data-slot'])}
      className={cn(
        'm-0 flex min-w-0 max-w-full list-none flex-wrap items-center gap-[var(--rad-breadcrumb-gap,0.5rem)] p-0',
        className
      )}
    />
  )
}
export function BreadcrumbItem({ className, ...props }: BreadcrumbItemProps) {
  const nativeProps = { ...props, role: undefined }
  return (
    <li
      {...nativeProps}
      data-slot={joinIds('breadcrumb-item', props['data-slot'])}
      className={cn(
        'inline-flex min-w-0 max-w-full items-center gap-[var(--rad-breadcrumb-gap,0.5rem)]',
        className
      )}
    />
  )
}
export function BreadcrumbLink({
  href,
  current = false,
  variant = 'subtle',
  tone = 'neutral',
  render,
  className,
  'data-slot': slot,
  ...props
}: BreadcrumbLinkProps) {
  return (
    <ComposedLink
      identity="breadcrumb-link"
      {...props}
      href={href}
      variant={variant}
      tone={tone}
      aria-current={current ? 'page' : undefined}
      className={cn(
        'min-w-0 [overflow-wrap:anywhere] [color:var(--rad-breadcrumb-link-color,var(--rad-color-muted-foreground))] hover:[color:var(--rad-breadcrumb-link-hover-color,var(--rad-color-foreground))]',
        className
      )}
      render={render}
      data-slot={slot}
    />
  )
}
export function BreadcrumbPage({ className, ...props }: BreadcrumbPageProps) {
  const nativeProps = { ...props, role: undefined }
  return (
    <span
      {...nativeProps}
      aria-current="page"
      data-slot={joinIds('breadcrumb-page', props['data-slot'])}
      className={cn(
        'min-w-0 [overflow-wrap:anywhere] [color:var(--rad-breadcrumb-current-color,var(--rad-color-foreground))] font-[number:var(--rad-typography-roles-ui-label-weight,600)]',
        className
      )}
    />
  )
}
/** Put separators inside an item, never as non-li children of the ordered list. */
export function BreadcrumbSeparator({
  className,
  children = '/',
  ...props
}: BreadcrumbSeparatorProps) {
  const nativeProps = { ...props, role: undefined, tabIndex: undefined }
  return (
    <span
      {...nativeProps}
      aria-hidden="true"
      data-slot={joinIds('breadcrumb-separator', props['data-slot'])}
      className={cn(
        'shrink-0 select-none [color:var(--rad-breadcrumb-separator-color,var(--rad-color-muted-foreground))]',
        className
      )}
    >
      {children}
    </span>
  )
}

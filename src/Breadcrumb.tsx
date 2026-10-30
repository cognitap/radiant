import type { ComponentProps, ReactElement } from 'react'
import { Link, type LinkProps, type LinkRenderProps } from './Link.js'
import { cn } from './cn.js'
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
export type BreadcrumbLinkRenderProps = Omit<LinkRenderProps, 'data-slot' | 'href'> & {
  'data-slot': string
  href: string
}
export type BreadcrumbLinkProps = Omit<LinkProps, 'href' | 'render' | 'aria-current' | 'role'> & {
  href: string
  current?: boolean
  'data-slot'?: string
  render?: (props: BreadcrumbLinkRenderProps) => ReactElement
}
export function Breadcrumb({ className, ...props }: BreadcrumbProps) {
  const labelledBy = props['aria-labelledby']?.trim()
  const label = props['aria-label']
  if (label !== undefined && !label.trim())
    throw new TypeError('Breadcrumb needs a nonempty navigation name.')
  const nativeProps = { ...props, role: undefined }
  return (
    <nav
      {...nativeProps}
      aria-label={label ?? (labelledBy ? undefined : 'Breadcrumb')}
      aria-labelledby={labelledBy || undefined}
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
    <Link
      {...props}
      href={href}
      variant={variant}
      tone={tone}
      aria-current={current ? 'page' : undefined}
      className={cn(
        'min-w-0 [overflow-wrap:anywhere] [color:var(--rad-breadcrumb-link-color,var(--rad-color-muted-foreground))] hover:[color:var(--rad-breadcrumb-link-hover-color,var(--rad-color-foreground))]',
        className
      )}
      render={native => {
        const resolved: BreadcrumbLinkRenderProps = {
          ...native,
          href,
          role: undefined,
          'data-slot': joinIds('link breadcrumb-link', slot) ?? 'link breadcrumb-link'
        }
        // oxlint-disable-next-line react/refs -- The adapter forwards resolved refs; it does not read ref.current.
        return render ? render(resolved) : <a {...resolved}>{resolved.children}</a>
      }}
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

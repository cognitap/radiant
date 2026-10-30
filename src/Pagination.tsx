import type { ComponentProps } from 'react'
import { Button, type ButtonProps } from './Button.js'
import {
  ComposedLink,
  type ComposedLinkProps,
  type ComposedLinkRenderProps
} from './composedLink.js'
import { cn } from './cn.js'
import { joinIds } from './internal/ids.js'
import type { ThemeStyle } from './themes/defineTheme.js'
type Part<Host extends 'nav' | 'ol' | 'li' | 'span'> = Omit<
  ComponentProps<Host>,
  'style' | 'role'
> & { style?: ThemeStyle; 'data-slot'?: string }
export type PaginationProps = Part<'nav'>
export type PaginationListProps = Part<'ol'>
export type PaginationItemProps = Part<'li'>
export type PaginationLinkRenderProps = ComposedLinkRenderProps
export type PaginationLinkProps = Omit<ComposedLinkProps, 'aria-current'> & { current?: boolean }
export type PaginationPreviousProps = Omit<PaginationLinkProps, 'current'>
export type PaginationNextProps = PaginationPreviousProps
export type PaginationButtonProps = Omit<ButtonProps, 'aria-current' | 'role'> & {
  current?: boolean
}
export type PaginationUnavailableProps = Omit<Part<'span'>, 'aria-disabled' | 'tabIndex'>
export type PaginationEllipsisProps = Omit<Part<'span'>, 'aria-hidden' | 'tabIndex'>
const itemClass =
  'min-w-[var(--rad-pagination-item-min-width,2rem)] rounded-[var(--rad-pagination-radius,var(--rad-control-radius,0.5rem))]'
export function Pagination({ className, ...props }: PaginationProps) {
  const labelledBy = props['aria-labelledby']?.trim(),
    label = props['aria-label']
  if (label !== undefined && !label.trim())
    throw new TypeError('Pagination needs a nonempty navigation name.')
  const nativeProps = { ...props, role: undefined }
  return (
    <nav
      {...nativeProps}
      aria-label={label ?? (labelledBy ? undefined : 'Pagination')}
      aria-labelledby={labelledBy || undefined}
      data-slot={joinIds('pagination', props['data-slot'])}
      className={cn('min-w-0 max-w-full', className)}
    />
  )
}
export function PaginationList({ className, ...props }: PaginationListProps) {
  const nativeProps = { ...props, role: undefined }
  return (
    <ol
      {...nativeProps}
      data-slot={joinIds('pagination-list', props['data-slot'])}
      className={cn(
        'm-0 flex min-w-0 max-w-full list-none flex-wrap items-center gap-[var(--rad-pagination-gap,0.25rem)] p-0',
        className
      )}
    />
  )
}
export function PaginationItem({ className, ...props }: PaginationItemProps) {
  const nativeProps = { ...props, role: undefined }
  return (
    <li
      {...nativeProps}
      data-slot={joinIds('pagination-item', props['data-slot'])}
      className={cn('inline-flex min-w-0', className)}
    />
  )
}
export function PaginationLink({
  current = false,
  variant = current ? 'solid' : 'ghost',
  tone = current ? 'accent' : 'neutral',
  controlSize = 'small',
  className,
  ...props
}: PaginationLinkProps) {
  return (
    <ComposedLink
      {...props}
      identity="pagination-link"
      variant={variant}
      tone={tone}
      controlSize={controlSize}
      aria-current={current ? 'page' : undefined}
      className={cn(itemClass, className)}
    />
  )
}
export function PaginationPrevious({ children = 'Previous', ...props }: PaginationPreviousProps) {
  return (
    <PaginationLink
      {...props}
      rel={props.rel ?? 'prev'}
      data-slot={joinIds('pagination-previous', props['data-slot'])}
    >
      {children}
    </PaginationLink>
  )
}
export function PaginationNext({ children = 'Next', ...props }: PaginationNextProps) {
  return (
    <PaginationLink
      {...props}
      rel={props.rel ?? 'next'}
      data-slot={joinIds('pagination-next', props['data-slot'])}
    >
      {children}
    </PaginationLink>
  )
}
export function PaginationButton({
  current = false,
  variant = current ? 'solid' : 'ghost',
  tone = current ? 'accent' : 'neutral',
  controlSize = 'small',
  className,
  ...props
}: PaginationButtonProps) {
  return (
    <Button
      {...props}
      variant={variant}
      tone={tone}
      controlSize={controlSize}
      aria-current={current ? 'page' : undefined}
      data-slot={joinIds('pagination-button', props['data-slot'])}
      className={cn(itemClass, className)}
    />
  )
}
export function PaginationUnavailable({ className, ...props }: PaginationUnavailableProps) {
  const nativeProps = { ...props, role: undefined, tabIndex: undefined }
  return (
    <span
      {...nativeProps}
      aria-disabled="true"
      data-slot={joinIds('pagination-unavailable', props['data-slot'])}
      className={cn(
        itemClass,
        'inline-flex items-center justify-center px-2 py-1 [color:var(--rad-color-muted-foreground)] font-[family-name:var(--rad-typography-roles-ui-body-family,system-ui,sans-serif)] text-[length:var(--rad-typography-roles-ui-body-size,0.875rem)] leading-[var(--rad-typography-roles-ui-body-line-height,1.5)]',
        className
      )}
    />
  )
}
export function PaginationEllipsis({
  className,
  children = '…',
  ...props
}: PaginationEllipsisProps) {
  const nativeProps = { ...props, role: undefined, tabIndex: undefined }
  return (
    <span
      {...nativeProps}
      aria-hidden="true"
      data-slot={joinIds('pagination-ellipsis', props['data-slot'])}
      className={cn(
        itemClass,
        'inline-flex items-center justify-center select-none [color:var(--rad-color-muted-foreground)]',
        className
      )}
    >
      {children}
    </span>
  )
}

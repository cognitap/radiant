import type { ComponentProps } from 'react'
import { cn } from './cn.js'
import { requireAccessibleName, type AccessibleName } from './internal/accessibleName.js'
import { joinIds } from './internal/ids.js'
import type { ThemeStyle } from './themes/defineTheme.js'
type Part<
  Host extends 'table' | 'caption' | 'thead' | 'tbody' | 'tfoot' | 'tr' | 'th' | 'td' | 'section'
> = Omit<ComponentProps<Host>, 'role' | 'style'> & { style?: ThemeStyle; 'data-slot'?: string }
export type TableProps = Part<'table'>
export type TableCaptionProps = Part<'caption'>
export type TableHeadProps = Part<'thead'>
export type TableBodyProps = Part<'tbody'>
export type TableFootProps = Part<'tfoot'>
export type TableRowProps = Part<'tr'>
export type TableHeaderProps = Part<'th'>
export type TableCellProps = Part<'td'>
export type TableContainerProps = Omit<
  Part<'section'>,
  'aria-label' | 'aria-labelledby' | 'tabIndex'
> &
  AccessibleName
const cellClass =
  'px-[var(--rad-table-padding-inline,var(--rad-control-small-padding-inline,0.75rem))] py-[var(--rad-table-padding-block,0.625rem)] text-start align-top [overflow-wrap:anywhere]'
export function Table({ className, ...props }: TableProps) {
  const nativeProps = { ...props, role: undefined }
  return (
    <table
      {...nativeProps}
      data-slot={joinIds('table', props['data-slot'])}
      className={cn(
        'w-full border-collapse text-start bg-[var(--rad-table-background,var(--rad-color-surface,white))] [color:var(--rad-table-color,var(--rad-color-foreground))] font-[family-name:var(--rad-typography-roles-ui-body-family,system-ui,sans-serif)] text-[length:var(--rad-table-font-size,var(--rad-typography-roles-ui-body-size,0.875rem))] font-[number:var(--rad-typography-roles-ui-body-weight,400)] leading-[var(--rad-typography-roles-ui-body-line-height,1.5)] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]',
        className
      )}
    />
  )
}
export function TableCaption({ className, ...props }: TableCaptionProps) {
  const nativeProps = { ...props, role: undefined }
  return (
    <caption
      {...nativeProps}
      data-slot={joinIds('table-caption', props['data-slot'])}
      className={cn(
        cellClass,
        'caption-top [color:var(--rad-table-caption-color,var(--rad-color-muted-foreground))]',
        className
      )}
    />
  )
}
export function TableHead({ className, ...props }: TableHeadProps) {
  const nativeProps = { ...props, role: undefined }
  return (
    <thead
      {...nativeProps}
      data-slot={joinIds('table-head', props['data-slot'])}
      className={cn('align-bottom', className)}
    />
  )
}
export function TableBody({ className, ...props }: TableBodyProps) {
  const nativeProps = { ...props, role: undefined }
  return (
    <tbody
      {...nativeProps}
      data-slot={joinIds('table-body', props['data-slot'])}
      className={cn('align-top', className)}
    />
  )
}
export function TableFoot({ className, ...props }: TableFootProps) {
  const nativeProps = { ...props, role: undefined }
  return (
    <tfoot
      {...nativeProps}
      data-slot={joinIds('table-foot', props['data-slot'])}
      className={cn('font-[number:var(--rad-typography-roles-ui-label-weight,600)]', className)}
    />
  )
}
export function TableRow({ className, ...props }: TableRowProps) {
  const nativeProps = { ...props, role: undefined }
  return (
    <tr
      {...nativeProps}
      data-slot={joinIds('table-row', props['data-slot'])}
      className={cn(
        'border-b-[length:var(--rad-table-border-width,var(--rad-surface-border-width,1px))] [border-style:var(--rad-surface-border-style,solid)] border-[var(--rad-table-border-color,var(--rad-color-border))] forced-colors:border-[CanvasText]',
        className
      )}
    />
  )
}
export function TableHeader({ scope = 'col', className, ...props }: TableHeaderProps) {
  const nativeProps = { ...props, role: undefined }
  return (
    <th
      {...nativeProps}
      scope={scope}
      data-slot={joinIds('table-header', props['data-slot'])}
      className={cn(
        cellClass,
        'bg-[var(--rad-table-header-background,var(--rad-color-neutral))] [color:var(--rad-table-header-color,var(--rad-color-foreground))] font-[number:var(--rad-typography-roles-ui-label-weight,600)] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]',
        'in-[thead]:font-[family-name:var(--rad-control-action-font-family,var(--rad-typography-roles-ui-label-family,system-ui,sans-serif))] in-[thead]:font-[number:var(--rad-control-action-font-weight,var(--rad-typography-roles-ui-label-weight,600))] in-[thead]:[text-transform:var(--rad-control-action-text-transform,none)] in-[thead]:tracking-[var(--rad-control-action-letter-spacing,normal)] in-[thead]:text-[length:var(--rad-control-small-font-size,0.8125rem)]',
        className
      )}
    />
  )
}
export function TableCell({ className, ...props }: TableCellProps) {
  const nativeProps = { ...props, role: undefined }
  return (
    <td
      {...nativeProps}
      data-slot={joinIds('table-cell', props['data-slot'])}
      className={cn(cellClass, className)}
    />
  )
}
/** An optional named keyboard scroll surface; Table itself remains the native table. */
export function TableContainer({ className, ...props }: TableContainerProps) {
  requireAccessibleName('TableContainer', props)
  // Keyboard focus enables native scrolling of this named overflow surface.
  const nativeProps = { ...props, role: undefined, tabIndex: 0 }
  return (
    <section
      {...nativeProps}
      data-slot={joinIds('table-container', props['data-slot'])}
      className={cn(
        'min-w-0 max-w-full overflow-auto rounded-[var(--rad-table-radius,var(--rad-surface-radius,0.75rem))] [corner-shape:var(--rad-surface-corner-shape,round)] border-[length:var(--rad-table-border-width,var(--rad-surface-border-width,1px))] [border-style:var(--rad-surface-border-style,solid)] border-[var(--rad-table-border-color,var(--rad-color-border))] [box-shadow:var(--rad-table-shadow,var(--rad-surface-shadow,none))] focus-visible:outline-solid focus-visible:[outline-color:var(--rad-color-focus)] focus-visible:[outline-width:var(--rad-focus-width,2px)] focus-visible:[outline-offset:var(--rad-focus-offset,2px)] focus-visible:[outline-style:var(--rad-focus-style,solid)] forced-colors:border-[CanvasText]',
        className
      )}
    />
  )
}

import type { ComponentProps, ReactNode } from 'react'
import { cn } from './cn.js'
import { joinIds } from './internal/ids.js'
import type { ThemeStyle } from './themes/defineTheme.js'

export type KbdProps = Omit<
  ComponentProps<'kbd'>,
  'style' | 'children' | 'role' | 'tabIndex' | 'contentEditable'
> & {
  children: ReactNode
  style?: ThemeStyle
  'data-slot'?: string
}

/** Keyboard notation only; applications own shortcut binding and modifier labels. */
export function Kbd({ className, ...props }: KbdProps) {
  const native = { ...props, role: undefined, tabIndex: undefined, contentEditable: undefined }
  return (
    <kbd
      {...native}
      data-slot={joinIds('kbd', props['data-slot'])}
      className={cn(
        'box-border inline-flex max-w-full min-w-[1.5em] items-center justify-center align-middle whitespace-nowrap text-center',
        'rounded-[var(--rad-kbd-radius,var(--rad-control-radius,0.5rem))] [corner-shape:var(--rad-control-corner-shape,round)] px-[var(--rad-kbd-padding-inline,0.375rem)] py-[var(--rad-kbd-padding-block,0.125rem)]',
        'bg-[var(--rad-kbd-background,var(--rad-color-surface,oklch(1_0_0)))] [color:var(--rad-kbd-color,var(--rad-color-foreground,oklch(0.21_0.006_286)))] [border-color:var(--rad-kbd-border-color,var(--rad-color-border,oklch(0.885_0.005_286)))] border-[length:var(--rad-control-border-width,1px)] [border-style:var(--rad-control-border-style,solid)]',
        'font-[family-name:var(--rad-typography-roles-code-family,ui-monospace,monospace)] text-[length:var(--rad-kbd-font-size,var(--rad-typography-roles-ui-supporting-size,0.8125rem))] font-[number:var(--rad-typography-roles-ui-label-weight,600)] [text-transform:var(--rad-control-action-text-transform,none)] leading-[1.2]',
        '[--_rad-kbd-shadow:var(--rad-kbd-shadow,inset_0_-1px_0_var(--rad-color-border,oklch(0.885_0.005_286)))] shadow-(--_rad-kbd-shadow)',
        'forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] forced-colors:shadow-none',
        className
      )}
    />
  )
}

export type KbdGroupProps = KbdProps
/** A combination is itself keyboard notation, containing individual Kbd keys. */
export function KbdGroup({ className, dir = 'ltr', ...props }: KbdGroupProps) {
  return (
    <Kbd
      {...props}
      dir={dir}
      data-slot={joinIds('kbd-group', props['data-slot'])}
      className={cn(
        'min-w-0 flex-wrap justify-start gap-[var(--rad-kbd-gap,0.25rem)] whitespace-normal border-0 bg-transparent p-0 shadow-none',
        className
      )}
    />
  )
}

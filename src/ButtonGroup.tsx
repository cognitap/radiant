/* oxlint-disable jsx-a11y/prefer-tag-over-role -- A passive action group uses a div; fieldset would introduce form grouping. */
import type { ComponentProps } from 'react'
import { cn } from './cn.js'
import { joinIds } from './internal/ids.js'
import type { Orientation } from './presentation.js'
import type { ThemeStyle } from './themes/defineTheme.js'

export type ButtonGroupProps = Omit<
  ComponentProps<'div'>,
  'style' | 'role' | 'aria-orientation'
> & {
  orientation?: Orientation
  style?: ThemeStyle
  /** Additional composed identities; the button-group token is always retained. */
  'data-slot'?: string
}

/** Joined presentation only: each real Button keeps its native focus and activation. */
export function ButtonGroup({ orientation = 'horizontal', className, ...props }: ButtonGroupProps) {
  if (orientation !== 'horizontal' && orientation !== 'vertical')
    throw new TypeError('ButtonGroup orientation must be horizontal or vertical.')
  return (
    <div
      {...props}
      role="group"
      aria-orientation={undefined}
      data-slot={joinIds('button-group', props['data-slot'])}
      data-orientation={orientation}
      className={cn(
        'isolate inline-flex max-w-full items-stretch align-middle [&>button]:relative [&>button]:rounded-none [&>button:focus-visible]:z-10',
        orientation === 'horizontal'
          ? 'flex-row [&>button:not(:first-of-type)]:-ms-[var(--rad-button-border-width,var(--rad-control-border-width,1px))] [&>button:first-of-type]:rounded-s-[var(--rad-button-group-radius,var(--rad-button-radius,var(--rad-control-radius,0.5rem)))] [&>button:last-of-type]:rounded-e-[var(--rad-button-group-radius,var(--rad-button-radius,var(--rad-control-radius,0.5rem)))]'
          : 'flex-col [&>button:not(:first-of-type)]:-mt-[var(--rad-button-border-width,var(--rad-control-border-width,1px))] [&>button:first-of-type]:rounded-t-[var(--rad-button-group-radius,var(--rad-button-radius,var(--rad-control-radius,0.5rem)))] [&>button:last-of-type]:rounded-b-[var(--rad-button-group-radius,var(--rad-button-radius,var(--rad-control-radius,0.5rem)))]',
        className
      )}
    />
  )
}

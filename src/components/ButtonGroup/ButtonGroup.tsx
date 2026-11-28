/* oxlint-disable jsx-a11y/prefer-tag-over-role -- A passive action group uses a div; fieldset would introduce form grouping. */
import type { ComponentProps } from 'react'
import { cn } from 'cn'
import { joinIds } from '../../internal/ids.js'
import type { Orientation } from '../../presentation.js'
import type { ThemeStyle } from '../../themes/defineTheme.js'

export type ButtonGroupProps = Omit<
  ComponentProps<'div'>,
  'style' | 'role' | 'aria-orientation'
> & {
  orientation?: Orientation
  style?: ThemeStyle
  /** Additional composed identities; the button-group token is always retained. */
  'data-slot'?: string
}

/** Closely spaced actions with independent focus and activation. */
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
        'inline-flex max-w-full items-stretch gap-[var(--rad-button-group-gap,calc(var(--rad-spacing-normal,1rem)/2))] align-middle',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        className
      )}
    />
  )
}

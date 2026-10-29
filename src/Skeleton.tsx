'use client'

import { useContext, type ComponentProps } from 'react'
import { cn } from './cn.js'
import { joinIds } from './internal/ids.js'
import { MotionProfileContext } from './motion/context.js'
import type { ThemeStyle } from './themes/defineTheme.js'

export type SkeletonProps = Omit<
  ComponentProps<'span'>,
  | 'children'
  | 'dangerouslySetInnerHTML'
  | 'style'
  | 'role'
  | 'aria-label'
  | 'aria-labelledby'
  | 'aria-hidden'
  | 'aria-live'
  | 'aria-busy'
  | 'tabIndex'
  | 'contentEditable'
> & {
  motion?: 'inherit' | 'off'
  style?: ThemeStyle
  'data-slot'?: string
}

/** An empty decorative shape. The application owns loading content and status. */
export function Skeleton({ motion = 'inherit', className, ...props }: SkeletonProps) {
  const profile = useContext(MotionProfileContext)
  const off = motion === 'off' || profile.mode === 'off'
  const {
    children: _children,
    dangerouslySetInnerHTML: _html,
    ...attributes
  }: ComponentProps<'span'> = props
  const nativeProps = {
    ...attributes,
    role: undefined,
    'aria-label': undefined,
    'aria-labelledby': undefined,
    'aria-live': undefined,
    'aria-busy': undefined,
    tabIndex: undefined,
    contentEditable: undefined
  }
  return (
    <span
      {...nativeProps}
      aria-hidden="true"
      data-slot={joinIds('skeleton', props['data-slot'])}
      data-motion={off ? 'off' : 'inherit'}
      className={cn(
        'block box-border max-w-full w-[var(--rad-skeleton-width,100%)] h-[var(--rad-skeleton-height,1rem)] rounded-[var(--rad-skeleton-radius,var(--rad-surface-radius,0.75rem))] bg-[var(--rad-skeleton-color,var(--rad-color-neutral))]',
        'border border-transparent forced-colors:[border-color:CanvasText] forced-colors:bg-[Canvas] forced-colors:animate-none',
        off ? 'animate-none' : 'animate-pulse motion-reduce:animate-none',
        '[animation-duration:var(--rad-skeleton-duration,2s)]',
        className
      )}
    />
  )
}

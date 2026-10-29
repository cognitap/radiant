'use client'

import { useContext, type ComponentProps } from 'react'
import { cn } from './cn.js'
import { joinIds } from './internal/ids.js'
import { MotionProfileContext } from './motion/context.js'
import type { ControlSize, PartStyle } from './presentation.js'
import type { ThemeStyle } from './themes/defineTheme.js'

export type SpinnerProps = Omit<
  ComponentProps<'svg'>,
  | 'children'
  | 'dangerouslySetInnerHTML'
  | 'style'
  | 'role'
  | 'aria-label'
  | 'aria-labelledby'
  | 'aria-hidden'
  | 'aria-live'
  | 'tabIndex'
  | 'focusable'
  | 'viewBox'
> & {
  /** Omit beside visible loading text; supply a name for a standalone indicator. */
  label?: string
  controlSize?: ControlSize
  motion?: 'inherit' | 'off'
  style?: ThemeStyle
  'data-slot'?: string
  parts?: { track?: PartStyle; indicator?: PartStyle }
}

/** A visual activity indicator, never an automatic live announcement. */
export function Spinner({
  label,
  controlSize = 'medium',
  motion = 'inherit',
  className,
  parts,
  ...props
}: SpinnerProps) {
  const profile = useContext(MotionProfileContext)
  if (label !== undefined && !label.trim()) throw new TypeError('Spinner label must not be empty.')
  const off = motion === 'off' || profile.mode === 'off'
  return (
    <svg
      {...props}
      role={label === undefined ? undefined : 'img'}
      aria-label={label}
      aria-labelledby={undefined}
      aria-hidden={label === undefined ? true : undefined}
      aria-live={undefined}
      tabIndex={undefined}
      focusable="false"
      viewBox="0 0 24 24"
      data-slot={joinIds('spinner', props['data-slot'])}
      data-control-size={controlSize}
      data-motion={off ? 'off' : 'inherit'}
      className={cn(
        'inline-block shrink-0 align-middle fill-none [color:var(--rad-spinner-color,currentColor)] stroke-[length:var(--rad-spinner-stroke-width,2)] forced-colors:text-[CanvasText]',
        controlSize === 'small'
          ? 'size-[var(--rad-spinner-size-small,1rem)]'
          : controlSize === 'large'
            ? 'size-[var(--rad-spinner-size-large,2rem)]'
            : 'size-[var(--rad-spinner-size,1.25rem)]',
        off ? 'animate-none' : 'animate-spin motion-reduce:animate-none',
        '[animation-duration:var(--rad-spinner-duration,1s)]',
        className
      )}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        data-slot="spinner-track"
        style={parts?.track?.style}
        className={cn('opacity-[var(--rad-spinner-track-opacity,0.25)]', parts?.track?.className)}
      />
      <path
        d="M12 3a9 9 0 0 1 9 9"
        stroke="currentColor"
        strokeLinecap="round"
        data-slot="spinner-indicator"
        className={parts?.indicator?.className}
        style={parts?.indicator?.style}
      />
    </svg>
  )
}

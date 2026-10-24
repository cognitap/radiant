'use client'

import type { ComponentProps, CSSProperties } from 'react'
import { actionVariants } from './actionStyles.js'
import type { ButtonVariant, ControlSize, Tone } from './presentation.js'
import { cn } from './cn.js'
import { composeAction } from './internal/events.js'
import { flattenComponents, type ThemeComponentOverrides } from './themes/components.js'

export type { ButtonVariant } from './presentation.js'

export type ButtonProps = ComponentProps<'button'> & {
  variant?: ButtonVariant
  tone?: Tone
  controlSize?: ControlSize
  iconOnly?: boolean
  fullWidth?: boolean
  pending?: boolean
}

export type ButtonTheme = NonNullable<ThemeComponentOverrides['button']> & {
  /** @deprecated This legacy setting has no rendering effect. */
  glowHover?: string
}

export function buttonTheme(theme: ButtonTheme): CSSProperties {
  return flattenComponents({ button: theme }) as CSSProperties
}

export function Button({
  type = 'button',
  variant = 'solid',
  tone = 'accent',
  controlSize = 'medium',
  iconOnly,
  fullWidth,
  className,
  pending = false,
  onClick,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      aria-busy={pending || undefined}
      data-slot="button"
      data-variant={variant}
      data-tone={tone}
      data-control-size={controlSize}
      className={cn(actionVariants({ variant, tone, controlSize, iconOnly, fullWidth }), className)}
      onClick={composeAction(
        onClick,
        undefined,
        event => pending || event.currentTarget.matches(':disabled')
      )}
      {...props}
    >
      <span
        className={cn(
          'inline-flex items-center gap-[0.5em] [&_svg]:shrink-0',
          pending && 'opacity-0 motion-reduce:opacity-100'
        )}
      >
        {children}
      </span>
      {pending ? <PendingMark /> : null}
    </button>
  )
}

function PendingMark() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-center justify-center motion-reduce:hidden"
    >
      <span className="size-[1.1em] animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
    </span>
  )
}

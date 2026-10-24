'use client'

import type { ComponentProps, CSSProperties } from 'react'
import type { VariantProps } from 'class-variance-authority'
import { actionVariants } from './actionStyles.js'
import { cn } from './cn.js'
import { composeAction } from './internal/events.js'
import { flattenComponents, type ThemeComponentOverrides } from './themes/components.js'

type ButtonVariants = VariantProps<typeof actionVariants>

export type ButtonVariant = NonNullable<ButtonVariants['variant']>
export type ButtonSize = NonNullable<ButtonVariants['size']>
export type ButtonRadius = NonNullable<ButtonVariants['radius']>

export type ButtonProps = ComponentProps<'button'> & {
  variant?: ButtonVariant
  size?: ButtonSize
  radius?: ButtonRadius
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
  variant,
  size,
  radius,
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
      data-variant={variant ?? 'primary'}
      data-size={size ?? 'default'}
      className={cn(actionVariants({ variant, size, radius, iconOnly, fullWidth }), className)}
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

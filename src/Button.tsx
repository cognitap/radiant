import type { ComponentProps, MouseEvent } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from './cn.js'

const buttonVariants = cva(
  [
    'relative box-border inline-flex shrink-0 select-none items-center justify-center border border-solid border-transparent text-center font-[family-name:inherit] font-medium tracking-[-0.01em]',
    'cursor-pointer transition-[scale,box-shadow,background-color,color] duration-100 ease-out',
    'active:scale-97',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
    'disabled:scale-none disabled:cursor-not-allowed disabled:text-disabled-foreground disabled:shadow-none disabled:inset-shadow-none',
    'aria-busy:scale-none aria-busy:cursor-progress',
    'motion-reduce:transition-none motion-reduce:active:scale-none',
    'forced-colors:border-[ButtonText] forced-colors:disabled:border-[GrayText] forced-colors:disabled:text-[GrayText]'
  ],
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground shadow-[0_1px_2px_0_rgb(0_0_0/0.2),0_0_0_1px_var(--color-primary-active)] inset-shadow-[0_1px_0_0_rgb(255_255_255/0.16)] hover:bg-primary-hover active:bg-primary-active active:inset-shadow-none disabled:bg-disabled aria-busy:hover:bg-primary aria-busy:active:bg-primary',
        secondary:
          'bg-secondary text-secondary-foreground shadow-[0_1px_2px_0_rgb(0_0_0/0.06),0_0_0_1px_rgb(0_0_0/0.06)] inset-shadow-[0_1px_0_0_rgb(255_255_255/0.6)] hover:bg-secondary-hover active:bg-secondary-active active:inset-shadow-none disabled:bg-disabled aria-busy:hover:bg-secondary aria-busy:active:bg-secondary',
        warning:
          'bg-warning text-warning-foreground shadow-[0_1px_2px_0_rgb(0_0_0/0.15),0_0_0_1px_var(--color-warning-active)] inset-shadow-[0_1px_0_0_rgb(255_255_255/0.3)] hover:bg-warning-hover active:bg-warning-active active:inset-shadow-none disabled:bg-disabled aria-busy:hover:bg-warning aria-busy:active:bg-warning',
        destructive:
          'bg-destructive text-destructive-foreground shadow-[0_1px_2px_0_rgb(0_0_0/0.2),0_0_0_1px_var(--color-destructive-active)] inset-shadow-[0_1px_0_0_rgb(255_255_255/0.16)] hover:bg-destructive-hover active:bg-destructive-active active:inset-shadow-none disabled:bg-disabled aria-busy:hover:bg-destructive aria-busy:active:bg-destructive',
        outline:
          'border-border bg-background text-foreground shadow-[0_1px_2px_0_rgb(0_0_0/0.05)] hover:bg-accent active:bg-accent-active disabled:border-disabled disabled:bg-transparent aria-busy:hover:bg-background aria-busy:active:bg-background',
        ghost:
          'bg-transparent text-foreground hover:bg-accent active:bg-accent-active disabled:bg-transparent aria-busy:hover:bg-transparent aria-busy:active:bg-transparent'
      },
      size: {
        small: 'min-h-8 px-3 py-1 text-sm leading-5 [&_svg]:size-3.5',
        default: 'min-h-10 px-4 py-1.5 text-[length:inherit] leading-6 [&_svg]:size-4',
        large: 'min-h-12 px-6 py-2.5 text-base leading-6 [&_svg]:size-5'
      },
      radius: {
        none: 'rounded-none',
        small: 'rounded-sm',
        default: 'rounded-control',
        large: 'rounded-xl',
        full: 'rounded-full'
      },
      iconOnly: {
        true: 'p-0',
        false: ''
      },
      fullWidth: {
        true: 'w-full',
        false: ''
      }
    },
    compoundVariants: [
      { iconOnly: true, size: 'small', class: 'size-8' },
      { iconOnly: true, size: 'default', class: 'size-10' },
      { iconOnly: true, size: 'large', class: 'size-12' }
    ],
    defaultVariants: {
      variant: 'primary',
      size: 'default',
      radius: 'default',
      iconOnly: false,
      fullWidth: false
    }
  }
)

type ButtonVariants = VariantProps<typeof buttonVariants>

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
      className={cn(buttonVariants({ variant, size, radius, iconOnly, fullWidth }), className)}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        if (pending) {
          event.preventDefault()
          return
        }
        onClick?.(event)
      }}
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
      <span className="size-[1em] animate-spin rounded-full border-2 border-current border-t-transparent" />
    </span>
  )
}

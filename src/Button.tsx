import type { ComponentProps, MouseEvent } from 'react'
import { cn } from './cn.js'

export type ButtonProps = ComponentProps<'button'> & {
  pending?: boolean
}

export function Button({
  type = 'button',
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
      className={cn(
        'relative box-border inline-flex min-h-10 select-none items-center justify-center rounded-control border border-solid border-transparent bg-primary px-4 py-2 text-center font-[family-name:inherit] text-[length:inherit] font-medium leading-6 tracking-[-0.01em] text-primary-foreground',
        'shadow-[0_1px_2px_0_rgb(0_0_0/0.2),0_0_0_1px_var(--color-primary-active)] inset-shadow-[0_1px_0_0_rgb(255_255_255/0.16)]',
        'cursor-pointer transition-[scale,box-shadow,background-color] duration-100 ease-out',
        'hover:bg-primary-hover',
        'active:scale-97 active:bg-primary-active active:inset-shadow-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
        'disabled:scale-none disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground disabled:shadow-none disabled:inset-shadow-none',
        'aria-busy:scale-none aria-busy:cursor-progress aria-busy:hover:bg-primary aria-busy:active:bg-primary',
        'motion-reduce:transition-none motion-reduce:active:scale-none',
        'forced-colors:border-[ButtonText] forced-colors:shadow-none forced-colors:disabled:border-[GrayText] forced-colors:disabled:text-[GrayText]',
        className
      )}
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
          'inline-flex items-center gap-2',
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
      <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
    </span>
  )
}

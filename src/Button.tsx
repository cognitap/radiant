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
        'relative box-border inline-flex min-h-11 select-none items-center justify-center rounded-control border border-solid border-transparent bg-primary px-5 py-2.5 text-center font-[family-name:inherit] text-[length:inherit] font-semibold leading-6 text-primary-foreground',
        'shadow-[0_4px_0_0_var(--color-primary-active)]',
        'cursor-pointer transition-[translate,box-shadow,background-color] duration-150 ease-out',
        'hover:bg-primary-hover',
        'active:translate-y-1 active:bg-primary-active active:shadow-none',
        'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus',
        'disabled:translate-none disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground disabled:shadow-none',
        'aria-busy:translate-none aria-busy:cursor-progress aria-busy:shadow-none aria-busy:hover:translate-none aria-busy:active:translate-none',
        'motion-reduce:transition-none motion-reduce:hover:translate-none motion-reduce:active:translate-none',
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

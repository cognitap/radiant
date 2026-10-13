import type { ComponentProps } from 'react'
import { cn } from './cn.js'

export type ButtonProps = ComponentProps<'button'>

export function Button({ type = 'button', className, ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex min-h-11 items-center justify-center rounded-control border border-transparent bg-primary px-5 py-2.5 text-center font-semibold leading-6 text-primary-foreground',
        'cursor-pointer hover:bg-primary-hover active:bg-primary-active',
        'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus',
        'disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground',
        'forced-colors:border-[ButtonText] forced-colors:disabled:border-[GrayText] forced-colors:disabled:text-[GrayText]',
        className
      )}
      {...props}
    />
  )
}

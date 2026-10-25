'use client'

import type { ComponentProps, ReactElement } from 'react'
import { Fragment, isValidElement } from 'react'
import { actionVariants } from './actionStyles.js'
import type { ButtonVariant, ControlSize, Tone } from './presentation.js'
import { cn } from './cn.js'
import { joinIds } from './internal/ids.js'
import { composeAction } from './internal/events.js'
import type { ThemeStyle } from './themes/defineTheme.js'

export type { ButtonVariant } from './presentation.js'

export type ButtonRenderProps = Omit<ComponentProps<'button'>, 'style'> & {
  style?: ThemeStyle
  'data-slot': string
  'data-variant': ButtonVariant
  'data-tone': Tone
  'data-control-size': ControlSize
}

export type ButtonProps = Omit<ComponentProps<'button'>, 'style'> & {
  style?: ThemeStyle
  /** Additional composed identities; the button token is always retained. */
  'data-slot'?: string
  /** Forward resolved presentation, children, native attributes and ref to one button host. */
  render?: (props: ButtonRenderProps) => ReactElement
  variant?: ButtonVariant
  tone?: Tone
  controlSize?: ControlSize
  iconOnly?: boolean
  fullWidth?: boolean
  pending?: boolean
}

export function Button({
  render,
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
  const buttonProps: ButtonRenderProps = {
    ...props,
    type,
    'aria-busy': pending || props['aria-busy'],
    'data-slot': joinIds('button', props['data-slot']) ?? 'button',
    'data-variant': variant,
    'data-tone': tone,
    'data-control-size': controlSize,
    className: cn(actionVariants({ variant, tone, controlSize, iconOnly, fullWidth }), className),
    onClick: composeAction(
      onClick,
      undefined,
      event => pending || event.currentTarget.matches(':disabled')
    ),
    children: (
      <>
        <span
          className={cn(
            'inline-flex items-center gap-[0.5em] [&_svg]:shrink-0',
            pending && 'opacity-0 motion-reduce:opacity-100'
          )}
        >
          {children}
        </span>
        {pending ? <PendingMark /> : null}
      </>
    )
  }
  if (!render) return <button {...buttonProps}>{buttonProps.children}</button>
  const element = render(buttonProps)
  if (
    !isValidElement(element) ||
    element.type === Fragment ||
    (typeof element.type === 'string' && element.type !== 'button')
  ) {
    throw new Error(
      'Button render must return one button or a component that forwards props to a button.'
    )
  }
  return element
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

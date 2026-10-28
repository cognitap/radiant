'use client'

import type { ComponentProps, ReactElement } from 'react'
import { Fragment, isValidElement } from 'react'
import { callerOwnsPress, springPressClass, offPressClass } from './motion/pressPolicy.js'
import { usePressHost } from './motion/host.js'
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
  /** Visual treatment; native submission behavior stays on type. */
  variant?: ButtonVariant
  /** Semantic action palette, independent of treatment. */
  tone?: Tone
  /** Shared action dimensions; defaults to medium. */
  controlSize?: ControlSize
  /** Square action; supply an accessible name for icon-only children. */
  iconOnly?: boolean
  fullWidth?: boolean
  /** Block activation and show progress while preserving focus and the label. */
  pending?: boolean
  /** Requires MotionProvider. Off also suppresses legacy spatial transitions. */
  motion?: 'inherit' | 'off'
}

export function Button({
  render,
  motion = 'inherit',
  ref,
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
  const callerOwnsScale = callerOwnsPress(props.style, className)
  const press = usePressHost(ref, motion === 'off' || callerOwnsScale)
  const motionOff = motion === 'off' || press.off
  const spatial = (press.active || motionOff) && !callerOwnsScale
  const buttonProps: ButtonRenderProps = {
    ...props,
    ref: press.active ? press.ref : ref,
    onPointerDown: event => {
      props.onPointerDown?.(event)
      if (!pending && !event.defaultPrevented) press.press(event.nativeEvent)
    },
    onPointerUp: event => {
      props.onPointerUp?.(event)
      press.release(event.nativeEvent)
    },
    onPointerCancel: event => {
      props.onPointerCancel?.(event)
      press.release(event.nativeEvent)
    },
    onPointerLeave: event => {
      props.onPointerLeave?.(event)
      press.release(event.nativeEvent)
    },
    onLostPointerCapture: event => {
      props.onLostPointerCapture?.(event)
      press.release(event.nativeEvent)
    },
    onBlur: event => {
      props.onBlur?.(event)
      press.release()
    },
    onKeyDown: event => {
      props.onKeyDown?.(event)
      if (!pending && !event.defaultPrevented) press.press(event.nativeEvent)
    },
    onKeyUp: event => {
      props.onKeyUp?.(event)
      press.release(event.nativeEvent)
    },
    type,
    'aria-busy': pending || props['aria-busy'],
    'data-slot': joinIds('button', props['data-slot']) ?? 'button',
    'data-variant': variant,
    'data-tone': tone,
    'data-control-size': controlSize,
    className: cn(
      actionVariants({ variant, tone, controlSize, iconOnly, fullWidth }),
      spatial && springPressClass,
      motionOff && !callerOwnsScale && offPressClass,
      className
    ),
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
  // oxlint-disable-next-line react/refs -- The render contract forwards refs; it does not read ref.current.
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

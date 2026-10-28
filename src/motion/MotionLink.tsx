'use client'
import { Link, type LinkProps } from '../Link.js'
import { cn } from '../cn.js'
import { usePressHost } from './host.js'
import { callerOwnsPress, springPressClass, offPressClass } from './pressPolicy.js'
export type MotionLinkProps = LinkProps & {
  /** Inherit the theme's spring policy; off suppresses spatial feedback. Requires MotionProvider. */
  motion?: 'inherit' | 'off'
}
/** Optional client adapter for action-shaped Link; ordinary Link stays server-renderable. */
export function MotionLink({ ref, motion = 'inherit', className, ...props }: MotionLinkProps) {
  const owns = callerOwnsPress(props.style, className)
  const disabled =
    owns ||
    motion === 'off' ||
    props.variant === undefined ||
    props.variant === 'inline' ||
    props.variant === 'subtle'
  const {
    ref: motionRef,
    press: startPress,
    release,
    off,
    active
  } = usePressHost<HTMLAnchorElement>(ref, disabled)
  return (
    <Link
      {...props}
      ref={active ? motionRef : ref}
      className={cn(
        active && springPressClass,
        (motion === 'off' || off) && !owns && offPressClass,
        className
      )}
      onPointerDown={event => {
        props.onPointerDown?.(event)
        if (!event.defaultPrevented) startPress(event.nativeEvent)
      }}
      onPointerUp={event => {
        props.onPointerUp?.(event)
        release(event.nativeEvent)
      }}
      onPointerCancel={event => {
        props.onPointerCancel?.(event)
        release(event.nativeEvent)
      }}
      onPointerLeave={event => {
        props.onPointerLeave?.(event)
        release(event.nativeEvent)
      }}
      onLostPointerCapture={event => {
        props.onLostPointerCapture?.(event)
        release(event.nativeEvent)
      }}
      onBlur={event => {
        props.onBlur?.(event)
        release()
      }}
      onKeyDown={event => {
        props.onKeyDown?.(event)
        if (!event.defaultPrevented) startPress(event.nativeEvent)
      }}
      onKeyUp={event => {
        props.onKeyUp?.(event)
        release(event.nativeEvent)
      }}
    />
  )
}

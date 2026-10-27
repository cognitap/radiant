'use client'
import { useContext } from 'react'
import { Link, type LinkProps } from '../Link.js'
import { cn } from '../cn.js'
import { MotionHostContext } from './host.js'
import { usePressHost } from './host.js'
import { callerOwnsPress, springPressClass, offPressClass } from './pressPolicy.js'
export type MotionLinkProps = LinkProps & { motion?: 'inherit' | 'off' }
/** Optional client adapter for action-shaped Link; ordinary Link stays server-renderable. */
export function MotionLink({ ref, motion = 'inherit', className, ...props }: MotionLinkProps) {
  const owns = callerOwnsPress(props.style, className)
  const disabled =
    owns ||
    motion === 'off' ||
    props.variant === undefined ||
    props.variant === 'inline' ||
    props.variant === 'subtle'
  const runtime = useContext(MotionHostContext)
  const active = runtime !== null && !disabled
  const {
    ref: motionRef,
    press: startPress,
    release
  } = usePressHost<HTMLAnchorElement>(ref, disabled)
  return (
    <Link
      {...props}
      ref={active ? motionRef : ref}
      className={cn(
        active && springPressClass,
        motion === 'off' && !owns && offPressClass,
        className
      )}
      onPointerDown={event => {
        props.onPointerDown?.(event)
        if (!event.defaultPrevented) startPress(event.nativeEvent)
      }}
      onPointerUp={event => {
        props.onPointerUp?.(event)
        release()
      }}
      onPointerCancel={event => {
        props.onPointerCancel?.(event)
        release()
      }}
      onPointerLeave={event => {
        props.onPointerLeave?.(event)
        release()
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
        release()
      }}
    />
  )
}

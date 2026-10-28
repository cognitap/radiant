'use client'
import { createContext, useContext, useEffect, useRef, useState, type Ref } from 'react'
import type { MotionProfile } from './config.js'
import { MotionProfileContext } from './context.js'
import { useComposedRefs } from '../react/useComposedRefs.js'

export interface MotionHostBinding {
  update(profile: MotionProfile): void
  press?(event: PointerEvent | KeyboardEvent): void
  release?(event?: PointerEvent | KeyboardEvent): void
  destroy(): void
}
export interface MotionHostRuntime {
  press(node: HTMLElement, profile: MotionProfile): MotionHostBinding
  disclosure?(node: HTMLElement, profile: MotionProfile): MotionHostBinding
  dialog?(node: HTMLElement, profile: MotionProfile): MotionHostBinding
}
export const MotionHostContext = createContext<MotionHostRuntime | null>(null)
/** Engine-free bridge: only the opt-in provider supplies implementation. */
export function usePressHost<Node extends HTMLElement>(
  ref: Ref<Node> | undefined,
  disabled: boolean
) {
  const runtime = useContext(MotionHostContext)
  const profile = useContext(MotionProfileContext)
  const node = useRef<Node>(null)
  const binding = useRef<{ node: HTMLElement; value: MotionHostBinding } | null>(null)
  const composed = useComposedRefs(node, ref)
  useEffect(() => {
    if (disabled || !runtime || !node.current || binding.current?.node !== node.current) {
      binding.current?.value.destroy()
      binding.current = null
    }
    if (!disabled && runtime && node.current) {
      binding.current ??= { node: node.current, value: runtime.press(node.current, profile) }
      binding.current.value.update(profile)
    }
  })
  useEffect(
    () => () => {
      binding.current?.value.destroy()
      binding.current = null
    },
    []
  )
  return {
    ref: composed,
    active: runtime !== null && !disabled,
    off: profile.mode === 'off',
    press(event: PointerEvent | KeyboardEvent) {
      binding.current?.value.press?.(event)
    },
    release(event?: PointerEvent | KeyboardEvent) {
      binding.current?.value.release?.(event)
    }
  }
}

/** Shared lifecycle for native presentation adapters; no engine enters the root path. */
export function useTransitionHost<Node extends HTMLElement>(
  kind: 'disclosure' | 'dialog',
  ref: Ref<Node> | undefined,
  disabled: boolean
) {
  const runtime = useContext(MotionHostContext)
  const profile = useContext(MotionProfileContext)
  const node = useRef<Node>(null)
  const binding = useRef<{ node: Node; value: MotionHostBinding } | null>(null)
  const composed = useComposedRefs(node, ref)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const attach = runtime?.[kind]
    if (disabled || !attach || !node.current || binding.current?.node !== node.current) {
      binding.current?.value.destroy()
      binding.current = null
    }
    if (!disabled && attach && node.current) {
      binding.current ??= { node: node.current, value: attach(node.current, profile) }
      binding.current.value.update(profile)
    }
    setReady(binding.current !== null)
  }, [disabled, kind, runtime, profile, composed])
  useEffect(
    () => () => {
      binding.current?.value.destroy()
      binding.current = null
    },
    []
  )
  return {
    ref: composed,
    active: !disabled && runtime?.[kind] !== undefined,
    ready,
    off: profile.mode === 'off'
  }
}

'use client'
import { createContext, useContext, useEffect, useRef, useState, type Ref } from 'react'
import type { MotionProfile } from './config.js'
import { MotionProfileContext } from './context.js'
import { useComposedRefs } from '../react/useComposedRefs.js'
import { bindDrawer, type DrawerBinding, type DrawerOptions } from '../internal/drawer.js'

export interface MotionHostBinding {
  update(profile: MotionProfile): void
  press?(event: PointerEvent | KeyboardEvent): void
  release?(event?: PointerEvent | KeyboardEvent): void
  destroy(): void
}
export interface MotionHostRuntime {
  drawer?(
    node: HTMLDialogElement,
    profile: MotionProfile,
    options: DrawerOptions
  ): DrawerBinding & { configure(profile: MotionProfile): void }
  press(node: HTMLElement, profile: MotionProfile): MotionHostBinding
  disclosure?(node: HTMLElement, profile: MotionProfile): MotionHostBinding
  dialog?(node: HTMLElement, profile: MotionProfile): MotionHostBinding
  popup?(node: HTMLElement, profile: MotionProfile): MotionHostBinding
  indicator?(node: HTMLElement, profile: MotionProfile): MotionHostBinding
}
export const MotionHostContext = createContext<MotionHostRuntime | null>(null)

/** Geometry and gestures remain functional without the optional engine. */
export function useDrawerHost(ref: Ref<HTMLDialogElement> | undefined, options: DrawerOptions) {
  const runtime = useContext(MotionHostContext),
    profile = useContext(MotionProfileContext)
  const node = useRef<HTMLDialogElement>(null)
  const binding = useRef<{
    node: HTMLDialogElement
    runtime: typeof runtime
    value: DrawerBinding & { configure?(profile: MotionProfile): void }
  } | null>(null)
  const composed = useComposedRefs(node, ref)
  useEffect(() => {
    if (
      binding.current &&
      (binding.current.node !== node.current || binding.current.runtime !== runtime)
    ) {
      binding.current.value.destroy()
      binding.current = null
    }
    if (!node.current) return
    binding.current ??= {
      node: node.current,
      runtime,
      value: runtime?.drawer?.(node.current, profile, options) ?? bindDrawer(node.current, options)
    }
    binding.current.value.configure?.(profile)
    binding.current.value.update(options)
  })
  useEffect(
    () => () => {
      binding.current?.value.destroy()
      binding.current = null
    },
    []
  )
  return composed
}
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
  kind: 'disclosure' | 'dialog' | 'popup' | 'indicator',
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

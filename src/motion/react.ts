'use client'
import {
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject
} from 'react'
import { createElement, type ReactNode } from 'react'
import { MotionHostContext } from './host.js'
import { bindPressMotion } from './press.js'
import { MotionProfileContext } from './context.js'
import { resolveMotion, type MotionInteraction } from './config.js'
import { createSpring, type SpringController } from './runtime.js'
import { bindSpringStyle, type SpringStyleProperty } from './browser.js'

// Start conservatively for SSR/hydration; only subscribing reads the browser.
const listeners = new Set<() => void>()
let query: MediaQueryList | undefined
function subscribeReduced(listener: () => void) {
  if (!query) query = window.matchMedia('(prefers-reduced-motion: reduce)')
  const current = query
  const notify = () => listener()
  listeners.add(notify)
  current.addEventListener('change', notify)
  return () => {
    listeners.delete(notify)
    current.removeEventListener('change', notify)
    if (!listeners.size) query = undefined
  }
}
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReduced,
    () => query?.matches ?? true,
    () => true
  )
}
export function useSpring(
  initial: number,
  interaction: MotionInteraction = 'follow',
  reducedValue?: number
): SpringController {
  const profile = useContext(MotionProfileContext)
  const reduced = useReducedMotion()
  const resolved = resolveMotion(profile, interaction, reduced)
  const owned = useRef<SpringController | null>(null)
  const requested = useRef(initial)
  const callbacks = useRef(new Set<(value: number) => void>())
  const initialOptions = useRef({ ...resolved, reducedValue })
  const policy = useRef(resolved.enabled)
  const initialValue = useRef(initial)
  const [controller] = useState<SpringController>(() => ({
    get: () => owned.current?.get() ?? requested.current,
    getVelocity: () => owned.current?.getVelocity() ?? 0,
    isAnimating: () => owned.current?.isAnimating() ?? false,
    to(next) {
      if (!Number.isFinite(next)) throw new TypeError('Spring value must be finite.')
      requested.current = next
      owned.current?.to(next)
    },
    jump(next) {
      if (!Number.isFinite(next)) throw new TypeError('Spring value must be finite.')
      requested.current = next
      owned.current?.jump(next)
    },
    stop() {
      owned.current?.stop()
      requested.current = owned.current?.get() ?? requested.current
    },
    configure(next) {
      owned.current?.configure({ ...next, enabled: policy.current && (next.enabled ?? true) })
    },
    subscribe(listener) {
      callbacks.current.add(listener)
      return () => {
        callbacks.current.delete(listener)
      }
    },
    destroy() {
      owned.current?.destroy()
    }
  }))
  useEffect(() => {
    const spring = createSpring(initialValue.current, initialOptions.current)
    owned.current = spring
    const off = spring.subscribe(next => callbacks.current.forEach(listener => listener(next)))
    spring.to(requested.current)
    return () => {
      off()
      spring.destroy()
      owned.current = null
    }
  }, [])
  const { stiffness, damping, mass } = resolved.parameters
  useEffect(() => {
    policy.current = resolved.enabled
    owned.current?.configure({
      enabled: resolved.enabled,
      parameters: { stiffness, damping, mass },
      reducedValue
    })
  }, [resolved.enabled, stiffness, damping, mass, reducedValue])
  return controller
}
/** Use the real native ref; events/state remain with the component and caller. */
export function useSpringStyle(
  ref: RefObject<HTMLElement | null>,
  property: SpringStyleProperty,
  initial: number,
  interaction: MotionInteraction = 'follow',
  reducedValue?: number
): SpringController {
  const spring = useSpring(initial, interaction, reducedValue)
  // Rebind after every commit to handle a replaced render host; no animation state enters React.
  useEffect(() => {
    if (!ref.current) return
    return bindSpringStyle(ref.current, spring, property)
  })
  return spring
}

const hostRuntime = { press: bindPressMotion }
/** Opt into native Radiant spring interactions without adding a DOM wrapper. */
export function MotionProvider({ children }: { children?: ReactNode }) {
  return createElement(MotionHostContext.Provider, { value: hostRuntime }, children)
}
export { MotionLink } from './MotionLink.js'
export type { MotionLinkProps } from './MotionLink.js'

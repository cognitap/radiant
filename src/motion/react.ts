'use client'
import {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject
} from 'react'
import { createElement, type ReactNode } from 'react'
import { MotionHostContext } from './host.js'
import { bindDisclosureMotion, bindDialogMotion } from './transitions.js'
import { bindPressMotion } from './press.js'
import { bindPopupMotion } from './popup.js'
import { bindIndicatorMotion } from './indicator.js'
import { bindLayoutMotion } from './layoutHost.js'
import { bindDrawerMotion } from './drawer.js'
import { MotionProfileContext } from './context.js'
import { resolveMotion, type MotionInteraction } from './config.js'
import { createSpringDrag, type SpringDragController, type SpringDragOptions } from './drag.js'
import { bindSpringDrag } from './dragBrowser.js'
import { createSpring, type SpringController } from './runtime.js'
import { bindSpringStyle, type SpringStyleProperty } from './browser.js'
import { bindSpringSource, type SpringSource } from './follow.js'
import { bindSpringLayout, type SpringLayoutController } from './layoutDom.js'

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
  const requestedVelocity = useRef<number | undefined>(undefined)
  const callbacks = useRef(new Set<(value: number) => void>())
  const initialOptions = useRef({ ...resolved, reducedValue })
  const policy = useRef(resolved.enabled)
  const initialValue = useRef(initial)
  const [controller] = useState<SpringController>(() => ({
    get: () => owned.current?.get() ?? requested.current,
    getVelocity: () => owned.current?.getVelocity() ?? 0,
    isAnimating: () => owned.current?.isAnimating() ?? false,
    to(next, velocity) {
      if (velocity !== undefined && !Number.isFinite(velocity))
        throw new TypeError('Velocity must be finite.')
      requestedVelocity.current = velocity
      if (!Number.isFinite(next)) throw new TypeError('Spring value must be finite.')
      requested.current = next
      owned.current?.to(next, velocity)
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
    spring.to(requested.current, requestedVelocity.current)
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

const hostRuntime = {
  drawer: bindDrawerMotion,
  press: bindPressMotion,
  disclosure: bindDisclosureMotion,
  dialog: bindDialogMotion,
  popup: bindPopupMotion,
  indicator: bindIndicatorMotion,
  layout: bindLayoutMotion
}
/** Opt into native Radiant spring interactions without adding a DOM wrapper. */
export function MotionProvider({ children }: { children?: ReactNode }) {
  return createElement(MotionHostContext.Provider, { value: hostRuntime }, children)
}
export { MotionLink } from './MotionLink.js'
export type { MotionLinkProps } from './MotionLink.js'

/** Dedicated one-axis handle binding; explicit native keyboard controls are retained. */
export function useSpringDrag(
  ref: RefObject<HTMLElement | null>,
  initial: number,
  options: Omit<SpringDragOptions, 'parameters' | 'enabled'> & { axis?: 'x' | 'y' }
) {
  const profile = useContext(MotionProfileContext)
  const reduced = useReducedMotion()
  const resolved = resolveMotion(profile, 'drag', reduced)
  const latest = useRef({ initial, options, resolved })
  const owned = useRef<SpringDragController | null>(null)
  const [control] = useState(() => ({
    get: () => owned.current?.get() ?? initial,
    getVelocity: () => owned.current?.getVelocity() ?? 0,
    subscribe: (listener: (value: number) => void) =>
      owned.current?.subscribe(listener) ?? (() => {}),
    to: (target: number) => owned.current?.to(target),
    cancel: () => owned.current?.cancel(),
    step: (direction: -1 | 1 | 'first' | 'last') => owned.current?.step(direction),
    isAnimating: () => owned.current?.isAnimating() ?? false
  }))
  useEffect(() => {
    const current = latest.current
    const drag = createSpringDrag(current.initial, { ...current.options, ...current.resolved })
    owned.current = drag
    return () => {
      drag.destroy()
      owned.current = null
    }
  }, [])
  const points = options.snapPoints?.join(',')
  const { stiffness, damping, mass } = resolved.parameters
  useEffect(() => {
    owned.current?.configure({
      min: options.min,
      max: options.max,
      snapPoints: points?.split(',').map(Number),
      parameters: { stiffness, damping, mass },
      enabled: resolved.enabled
    })
  }, [options.min, options.max, points, stiffness, damping, mass, resolved.enabled])
  const binding = useRef<{
    node: HTMLElement
    axis: 'x' | 'y' | undefined
    cleanup: () => void
  } | null>(null)
  useEffect(() => {
    if (
      binding.current &&
      (binding.current.node !== ref.current || binding.current.axis !== options.axis)
    ) {
      binding.current.cleanup()
      binding.current = null
    }
    if (!binding.current && ref.current && owned.current)
      binding.current = {
        node: ref.current,
        axis: options.axis,
        cleanup: bindSpringDrag(ref.current, owned.current, options.axis)
      }
  })
  useEffect(
    () => () => {
      binding.current?.cleanup()
      binding.current = null
    },
    []
  )
  return control
}

/** Follow committed numeric props or an external source without rendering each spring frame. */
export function useSpringFollow(
  target: number | SpringSource,
  interaction: MotionInteraction = 'follow',
  reducedValue?: number
): SpringController {
  const spring = useSpring(
    typeof target === 'number' ? target : target.get(),
    interaction,
    reducedValue
  )
  useEffect(() => {
    if (typeof target === 'number') spring.to(target)
    else return bindSpringSource(spring, target)
  }, [spring, target])
  return spring
}

/** Batch direct-child layout slots after each commit and observe later intrinsic changes. */
export function useSpringLayout(
  ref: RefObject<HTMLElement | null>
): Pick<SpringLayoutController, 'measure' | 'get' | 'getVelocity' | 'isAnimating'> {
  const profile = useContext(MotionProfileContext)
  const reduced = useReducedMotion()
  const resolved = resolveMotion(profile, 'layout', reduced)
  const binding = useRef<{ node: HTMLElement; controller: SpringLayoutController } | null>(null)
  const [controller] = useState<
    Pick<SpringLayoutController, 'measure' | 'get' | 'getVelocity' | 'isAnimating'>
  >(() => ({
    measure: () => binding.current?.controller.measure(),
    get: slot => binding.current?.controller.get(slot),
    getVelocity: slot => binding.current?.controller.getVelocity(slot),
    isAnimating: () => binding.current?.controller.isAnimating() ?? false
  }))
  useLayoutEffect(() => {
    if (binding.current?.node !== ref.current) {
      binding.current?.controller.destroy()
      binding.current = null
    }
    if (!ref.current) return
    if (!binding.current)
      binding.current = { node: ref.current, controller: bindSpringLayout(ref.current, resolved) }
    else {
      binding.current.controller.configure(resolved)
      binding.current.controller.measure()
    }
  })
  useLayoutEffect(
    () => () => {
      binding.current?.controller.destroy()
      binding.current = null
    },
    []
  )
  return controller
}

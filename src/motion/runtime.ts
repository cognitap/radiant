import { springValue } from 'motion'
import { resolveSpringParameters, type SpringParameters } from './config.js'

export interface SpringOptions {
  readonly parameters?: Partial<SpringParameters>
  readonly enabled?: boolean
  /** Presentation neutral (e.g. scale 1); otherwise off snaps to the latest goal. */
  readonly reducedValue?: number
}
export interface SpringController {
  get(): number
  getVelocity(): number
  isAnimating(): boolean
  to(target: number, velocity?: number): void
  jump(target: number): void
  /** Stop at the current presentation and discard the old goal. */
  stop(): void
  configure(options: SpringOptions): void
  subscribe(listener: (value: number) => void): () => void
  destroy(): void
}
function finite(value: number) {
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new TypeError('Spring values must be finite numbers in one consistent unit.')
  return value
}
function same(a: SpringParameters, b: SpringParameters) {
  return a.stiffness === b.stiffness && a.damping === b.damping && a.mass === b.mass
}
/** One persistent upstream follower; numeric values only, no DOM or React ownership. */
export function createSpring(initial: number, options: SpringOptions = {}): SpringController {
  let parameters = resolveSpringParameters(options.parameters)
  let pending = parameters
  let value = springValue(finite(initial), parameters)
  let enabled = options.enabled ?? true
  let reducedValue = options.reducedValue === undefined ? undefined : finite(options.reducedValue)
  let target = initial
  let destroyed = false
  const listeners = new Set<(value: number) => void>()
  let offChange: () => void
  let offComplete: () => void
  function attach() {
    offChange = value.on('change', next => listeners.forEach(listener => listener(next)))
    offComplete = value.on('animationComplete', applyPending)
  }
  function applyPending() {
    if (destroyed || same(parameters, pending)) return
    const current = value.get()
    offChange()
    offComplete()
    value.destroy()
    parameters = pending
    value = springValue(current, parameters)
    attach()
  }
  attach()
  const controller: SpringController = {
    get: () => value.get(),
    getVelocity: () => (destroyed ? 0 : value.getVelocity()),
    isAnimating: () => !destroyed && value.isAnimating(),
    to(next, velocity) {
      finite(next)
      if (velocity !== undefined) finite(velocity)
      if (destroyed) return
      target = next
      if (enabled) {
        if (velocity !== undefined) {
          const current = value.get()
          value.jump(current)
          applyPending()
          value.setWithVelocity(current - velocity / 60, current, 1000 / 60)
        }
        value.set(next)
      } else value.jump(reducedValue ?? target)
    },
    jump(next) {
      finite(next)
      if (destroyed) return
      target = next
      value.jump(enabled ? next : (reducedValue ?? next))
      applyPending()
    },
    stop() {
      if (destroyed) return
      target = value.get()
      value.jump(target)
      applyPending()
    },
    configure(next) {
      const resolved = resolveSpringParameters(next.parameters, pending)
      const neutral = Object.hasOwn(next, 'reducedValue')
        ? next.reducedValue === undefined
          ? undefined
          : finite(next.reducedValue)
        : reducedValue
      if (destroyed) return
      pending = resolved
      reducedValue = neutral
      enabled = next.enabled ?? enabled
      if (!enabled) value.jump(reducedValue ?? target)
      // Parameter changes take effect at rest, so in-flight momentum is never replaced.
      if (!value.isAnimating()) applyPending()
    },
    subscribe(listener) {
      if (destroyed) return () => {}
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    destroy() {
      if (destroyed) return
      destroyed = true
      offChange()
      offComplete()
      value.destroy()
      listeners.clear()
    }
  }
  if (!enabled) value.jump(reducedValue ?? target)
  return controller
}

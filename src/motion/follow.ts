import type { SpringController } from './runtime.js'

/** Synchronous numeric snapshot with notifications in the same units as the follower. */
export interface SpringSource {
  get(): number
  subscribe(listener: (value: number) => void): () => void
}
/** The source owns destinations; the existing spring owns position, momentum and physics. */
export function bindSpringSource(spring: SpringController, source: SpringSource): () => void {
  if (source === spring) throw new TypeError('A spring cannot follow itself.')
  let active = true
  const off = source.subscribe(value => {
    if (active) spring.to(value)
  })
  try {
    // Read after subscribing so a synchronous subscription cannot leave a stale goal.
    spring.to(source.get())
  } catch (error) {
    active = false
    off()
    throw error
  }
  return () => {
    if (!active) return
    active = false
    off()
  }
}

import { springValue } from 'motion'

// Bounded suitability adapter: local pixel coordinates; caller measures natural-flow
// slots. Keep one spring per axis across retargets, rather than replacing projection.
export function layoutAdapter(initial, apply, physics) {
  const values = Object.fromEntries(
    Object.entries(initial).map(([key, value]) => [key, springValue(value, physics)])
  )
  let target = initial
  const draw = () =>
    apply(Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.get()])))
  const unsubscribe = Object.values(values).map(value => value.on('change', draw))
  draw()
  return {
    values,
    to(next, enabled) {
      target = next
      for (const [key, value] of Object.entries(values)) {
        if (enabled) value.set(next[key])
        else value.jump(next[key])
      }
    },
    stop() {
      for (const [key, value] of Object.entries(values)) value.jump(target[key])
    },
    destroy() {
      unsubscribe.forEach(off => off())
      Object.values(values).forEach(value => value.destroy())
    }
  }
}

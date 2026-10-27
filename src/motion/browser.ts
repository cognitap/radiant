import type { SpringController } from './runtime.js'

export type SpringStyleProperty =
  | 'scale'
  | 'opacity'
  | 'width'
  | 'height'
  | 'translateX'
  | 'translateY'
/** Bind one explicitly reserved individual property; never overwrite transform or events. */
export function bindSpringStyle(
  node: HTMLElement,
  spring: SpringController,
  property: SpringStyleProperty
): () => void {
  if (!['scale', 'opacity', 'width', 'height', 'translateX', 'translateY'].includes(property))
    throw new TypeError('Unsupported spring style property.')
  const key = property === 'translateX' || property === 'translateY' ? 'translate' : property
  const previous = node.style.getPropertyValue(key)
  const priority = node.style.getPropertyPriority(key)
  let owned = previous
  const apply = (next: number) => {
    const formatted =
      property === 'width' || property === 'height'
        ? `${Math.max(0, next)}px`
        : property === 'translateX'
          ? `${next}px 0px`
          : property === 'translateY'
            ? `0px ${next}px`
            : property === 'opacity'
              ? String(Math.max(0, Math.min(1, next)))
              : String(Math.max(0, next))
    node.style.setProperty(key, formatted)
    owned = node.style.getPropertyValue(key)
  }
  apply(spring.get())
  const off = spring.subscribe(apply)
  return () => {
    off()
    // A caller may have reclaimed the property since the last spring frame.
    if (node.style.getPropertyValue(key) !== owned) return
    if (previous) node.style.setProperty(key, previous, priority)
    else node.style.removeProperty(key)
  }
}

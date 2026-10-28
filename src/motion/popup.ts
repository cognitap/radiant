import { createSpring } from './runtime.js'
import { resolveMotion, type MotionProfile } from './config.js'
import type { MotionHostBinding } from './host.js'

/** Enter presentation only. Closing, focus and top-layer removal are immediate. */
export function bindPopupMotion(node: HTMLElement, initial: MotionProfile): MotionHostBinding {
  let profile = initial
  let open = false
  const win = node.ownerDocument.defaultView!
  const query = win.matchMedia('(prefers-reduced-motion: reduce)')
  const spring = createSpring(0, {
    ...resolveMotion(profile, 'dialog', query.matches),
    reducedValue: 0
  })
  const previous = node.style.getPropertyValue('--_rad-select-enter')
  let owned = previous
  const off = spring.subscribe(value => {
    owned = String(Math.max(0, Math.min(1, value)))
    node.style.setProperty('--_rad-select-enter', owned)
  })
  const sync = () => {
    const next = node.dataset.state === 'open'
    const resolved = resolveMotion(profile, 'dialog', query.matches)
    spring.configure({ ...resolved, reducedValue: next ? 1 : 0 })
    if (next !== open) {
      open = next
      if (next) {
        spring.jump(0)
        spring.to(1)
      } else spring.jump(0)
    } else if (!resolved.enabled) spring.jump(next ? 1 : 0)
  }
  const observer = new win.MutationObserver(sync)
  observer.observe(node, { attributes: true, attributeFilter: ['data-state'] })
  query.addEventListener('change', sync)
  sync()
  return {
    update(next) {
      profile = next
      sync()
    },
    destroy() {
      observer.disconnect()
      query.removeEventListener('change', sync)
      off()
      spring.destroy()
      if (node.style.getPropertyValue('--_rad-select-enter') === owned) {
        if (previous) node.style.setProperty('--_rad-select-enter', previous)
        else node.style.removeProperty('--_rad-select-enter')
      }
    }
  }
}

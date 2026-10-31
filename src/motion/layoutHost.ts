import { bindSpringLayout } from './layoutDom.js'
import { resolveMotion, type MotionProfile } from './config.js'
import type { MotionHostBinding } from './host.js'
/** The optional host bridge shares the public layout adapter and its property leases. */
export function bindLayoutMotion(node: HTMLElement, initial: MotionProfile): MotionHostBinding {
  const view = node.ownerDocument.defaultView!,
    query = view.matchMedia('(prefers-reduced-motion: reduce)')
  let profile = initial
  const controller = bindSpringLayout(node, resolveMotion(profile, 'layout', query.matches))
  const sync = () => {
    controller.configure(resolveMotion(profile, 'layout', query.matches))
    controller.measure()
  }
  query.addEventListener('change', sync)
  return {
    update(next) {
      profile = next
      sync()
    },
    destroy() {
      query.removeEventListener('change', sync)
      controller.destroy()
    }
  }
}

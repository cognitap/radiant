import { bindDrawer, type DrawerOptions } from '../internal/drawer.js'
import { createSpringDrag } from './drag.js'
import { createSpring } from './runtime.js'
import { resolveMotion, type MotionProfile } from './config.js'

export function bindDrawerMotion(
  node: HTMLDialogElement,
  initial: MotionProfile,
  initialOptions: DrawerOptions
) {
  let profile = initial,
    options = initialOptions
  const query = node.ownerDocument.defaultView!.matchMedia('(prefers-reduced-motion: reduce)')
  const policy = (interaction: 'drag' | 'dialog') =>
    resolveMotion(profile, interaction, query.matches || options.motion === 'off')
  const drag = createSpringDrag(options.snapPoint, {
    min: 0,
    max: 1,
    snapPoints: [0, ...options.snapPoints],
    ...policy('drag')
  })
  const entry = createSpring(1, policy('dialog'))
  const binding = bindDrawer(node, options, drag, entry)
  function configure(next: MotionProfile) {
    profile = next
    drag.configure(policy('drag'))
    entry.configure(policy('dialog'))
  }
  const preference = () => configure(profile)
  query.addEventListener('change', preference)
  return {
    configure,
    update(next: DrawerOptions) {
      options = next
      configure(profile)
      binding.update(next)
    },
    destroy() {
      query.removeEventListener('change', preference)
      binding.destroy()
    }
  }
}

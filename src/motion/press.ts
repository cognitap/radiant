import { createSpring } from './runtime.js'
import { bindSpringStyle } from './browser.js'
import { resolveMotion, type MotionProfile } from './config.js'
import type { MotionHostBinding } from './host.js'

/** Presentation only: this adapter never clicks, submits, captures or prevents input. */
export function bindPressMotion(
  node: HTMLElement,
  initialProfile: MotionProfile
): MotionHostBinding {
  let profile = initialProfile
  const query = node.ownerDocument.defaultView!.matchMedia('(prefers-reduced-motion: reduce)')
  const spring = createSpring(1, {
    ...resolveMotion(profile, 'press', query.matches),
    reducedValue: 1
  })
  const unbind = bindSpringStyle(node, spring, 'scale')
  const blocked = () =>
    node.matches(':disabled') ||
    node.getAttribute('aria-busy') === 'true' ||
    node.getAttribute('aria-disabled') === 'true'
  const release = () => spring.to(1)
  function update(next: MotionProfile) {
    profile = next
    spring.configure({ ...resolveMotion(profile, 'press', query.matches), reducedValue: 1 })
    if (blocked()) spring.jump(1)
  }
  const changed = () => update(profile)
  query.addEventListener('change', changed)
  const observer = new MutationObserver(() => {
    if (blocked()) spring.jump(1)
  })
  observer.observe(node, {
    attributes: true,
    attributeFilter: ['disabled', 'aria-busy', 'aria-disabled']
  })
  for (let parent = node.parentElement; parent; parent = parent.parentElement) {
    if (parent.tagName === 'FIELDSET')
      observer.observe(parent, { attributes: true, attributeFilter: ['disabled'] })
  }
  const document = node.ownerDocument
  document.addEventListener('pointerup', release)
  document.addEventListener('pointercancel', release)
  document.addEventListener('keyup', release)
  document.defaultView!.addEventListener('blur', release)
  return {
    update,
    press(event) {
      if (event.defaultPrevented || blocked()) {
        release()
        return
      }
      if ('key' in event) {
        if (
          event.repeat ||
          !['Enter', ...(node.tagName === 'BUTTON' ? [' '] : [])].includes(event.key)
        )
          return
      } else if (event.button !== 0 || event.isPrimary === false) return
      const scale = Number(
        getComputedStyle(node).getPropertyValue('--rad-button-press-scale').trim() || '.97'
      )
      spring.to(Number.isFinite(scale) && scale >= 0.5 && scale <= 1 ? scale : 0.97)
    },
    release,
    destroy() {
      observer.disconnect()
      query.removeEventListener('change', changed)
      document.removeEventListener('pointerup', release)
      document.removeEventListener('pointercancel', release)
      document.removeEventListener('keyup', release)
      document.defaultView!.removeEventListener('blur', release)
      spring.destroy()
      unbind()
    }
  }
}

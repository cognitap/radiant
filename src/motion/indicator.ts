import { createSpring } from './runtime.js'
import { resolveMotion, type MotionProfile } from './config.js'
import type { MotionHostBinding } from './host.js'

const axes = ['x', 'y', 'width', 'height'] as const
/** Follow an engine-free host's local rectangle; geometry and selection belong to that host. */
export function bindIndicatorMotion(node: HTMLElement, initial: MotionProfile): MotionHostBinding {
  const view = node.ownerDocument.defaultView!,
    query = view.matchMedia('(prefers-reduced-motion: reduce)')
  let profile = initial,
    visible = false
  const read = (): number[] | null => {
    const raw = node.getAttribute('data-rad-indicator-target')
    if (!raw || node.hidden) return null
    const value: unknown = JSON.parse(raw)
    return Array.isArray(value) &&
      value.length === 4 &&
      value.every(item => typeof item === 'number' && Number.isFinite(item))
      ? value
      : null
  }
  const start = read() ?? [0, 0, 0, 0],
    previous = axes.map(axis => node.style.getPropertyValue(`--_rad-indicator-${axis}`)),
    owned = [...previous]
  const springs = start.map(value =>
    createSpring(value, { ...resolveMotion(profile, 'follow', query.matches), reducedValue: value })
  )
  const offs = springs.map((spring, index) =>
    spring.subscribe(value => {
      owned[index] = `${index > 1 ? Math.max(0, value) : value}px`
      node.style.setProperty(`--_rad-indicator-${axes[index]}`, owned[index])
    })
  )
  const sync = () => {
    const target = read()
    if (!target) {
      springs.forEach(spring => spring.stop())
      visible = false
      return
    }
    const resolved = resolveMotion(profile, 'follow', query.matches)
    springs.forEach((spring, index) => {
      spring.configure({ ...resolved, reducedValue: target[index] })
      if (!visible || !resolved.enabled) spring.jump(target[index])
      else spring.to(target[index])
      owned[index] = `${index > 1 ? Math.max(0, spring.get()) : spring.get()}px`
      node.style.setProperty(`--_rad-indicator-${axes[index]}`, owned[index])
    })
    visible = true
  }
  const observer = new view.MutationObserver(sync)
  observer.observe(node, {
    attributes: true,
    attributeFilter: ['data-rad-indicator-target', 'hidden']
  })
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
      offs.forEach(off => off())
      springs.forEach(spring => spring.destroy())
      axes.forEach((axis, index) => {
        const name = `--_rad-indicator-${axis}`
        if (node.style.getPropertyValue(name) === owned[index]) {
          if (previous[index]) node.style.setProperty(name, previous[index])
          else node.style.removeProperty(name)
        }
      })
    }
  }
}

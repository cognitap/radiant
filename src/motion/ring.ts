import { resolveMotion, type MotionProfile } from './config.js'
import type { MotionHostBinding } from './host.js'
import { createSpring, type SpringOptions } from './runtime.js'

function range(arc: SVGCircleElement) {
  const [from, to] = arc.dataset.radRingArc!.split(' ').map(Number)
  return { from, to }
}

function bindArc(arc: SVGCircleElement, options: SpringOptions) {
  const start = range(arc)
  const from = createSpring(start.from, options)
  const to = createSpring(start.to, options)
  const clamp = (value: number) => Math.max(0, Math.min(100, value))
  const previousArray = arc.style.strokeDasharray
  const previousOffset = arc.style.strokeDashoffset
  let array = ''
  let offset = ''
  const draw = () => {
    const position = clamp(from.get())
    arc.style.strokeDasharray = `${Math.max(0, clamp(to.get()) - position)} 100`
    arc.style.strokeDashoffset = String(-position)
    array = arc.style.strokeDasharray
    offset = arc.style.strokeDashoffset
  }
  const offFrom = from.subscribe(draw)
  const offTo = to.subscribe(draw)
  draw()
  return {
    update(next: SpringOptions) {
      const target = range(arc)
      from.configure(next)
      to.configure(next)
      from.to(target.from)
      to.to(target.to)
    },
    destroy() {
      offFrom()
      offTo()
      from.destroy()
      to.destroy()
      if (arc.style.strokeDasharray === array) arc.style.strokeDasharray = previousArray
      if (arc.style.strokeDashoffset === offset) arc.style.strokeDashoffset = previousOffset
    }
  }
}

/** Follow arc endpoints without changing the native semantic reading. */
export function bindRingMotion(host: HTMLElement, initial: MotionProfile): MotionHostBinding {
  const view = host.ownerDocument.defaultView!
  const preference = view.matchMedia('(prefers-reduced-motion: reduce)')
  const arcs = new Map<SVGCircleElement, ReturnType<typeof bindArc>>()
  let profile = initial
  function sync() {
    const options = resolveMotion(profile, 'follow', preference.matches)
    const current = new Set(host.querySelectorAll<SVGCircleElement>('circle[data-rad-ring-arc]'))
    for (const [arc, binding] of arcs) {
      if (current.has(arc)) continue
      binding.destroy()
      arcs.delete(arc)
    }
    for (const arc of current) {
      const existing = arcs.get(arc)
      if (existing) existing.update(options)
      else arcs.set(arc, bindArc(arc, options))
    }
  }
  const observer = new view.MutationObserver(sync)
  observer.observe(host, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['data-rad-ring-arc']
  })
  preference.addEventListener('change', sync)
  sync()
  return {
    update(next) {
      profile = next
      sync()
    },
    destroy() {
      observer.disconnect()
      preference.removeEventListener('change', sync)
      for (const binding of arcs.values()) binding.destroy()
      arcs.clear()
    }
  }
}

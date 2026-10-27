import { createSpring } from './runtime.js'
import { bindSpringStyle } from './browser.js'
import { resolveMotion, type MotionProfile } from './config.js'
import type { MotionHostBinding } from './host.js'

export function bindDisclosureMotion(host: HTMLElement, initial: MotionProfile): MotionHostBinding {
  const node = host as HTMLDetailsElement
  let profile = initial
  const query = node.ownerDocument.defaultView!.matchMedia('(prefers-reduced-motion: reduce)')
  const contents = () =>
    Array.from(node.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement && child.tagName !== 'SUMMARY'
    )
  const measure = () =>
    contents().reduce((sum, child) => sum + child.getBoundingClientRect().height, 0)
  const previous = node.style.getPropertyValue('--_rad-spring-details-height')
  const spring = createSpring(
    node.open ? measure() : 0,
    resolveMotion(profile, 'disclosure', query.matches)
  )
  const saved = new Map<HTMLElement, { inert: boolean; hidden: string | null }>()
  const render = (value: number) =>
    node.style.setProperty('--_rad-spring-details-height', `${Math.max(0, value)}px`)
  const off = spring.subscribe(render)
  render(spring.get())
  function sync() {
    for (const child of contents()) {
      if (!node.open) {
        if (!saved.has(child))
          saved.set(child, { inert: child.inert, hidden: child.getAttribute('aria-hidden') })
        child.inert = true
        child.setAttribute('aria-hidden', 'true')
      } else restore(child)
    }
    spring.to(node.open ? measure() : 0)
  }
  function restore(child: HTMLElement) {
    const prior = saved.get(child)
    if (!prior) return
    child.inert = prior.inert
    if (prior.hidden === null) child.removeAttribute('aria-hidden')
    else child.setAttribute('aria-hidden', prior.hidden)
    saved.delete(child)
  }
  const observer = new MutationObserver(sync)
  observer.observe(node, { attributes: true, attributeFilter: ['open'], childList: true })
  const resize = new ResizeObserver(sync)
  contents().forEach(child => resize.observe(child))
  function update(next: MotionProfile) {
    profile = next
    spring.configure(resolveMotion(profile, 'disclosure', query.matches))
    sync()
  }
  const preference = () => update(profile)
  query.addEventListener('change', preference)
  sync()
  return {
    update,
    destroy() {
      observer.disconnect()
      resize.disconnect()
      query.removeEventListener('change', preference)
      off()
      spring.destroy()
      for (const child of saved.keys()) restore(child)
      if (previous) node.style.setProperty('--_rad-spring-details-height', previous)
      else node.style.removeProperty('--_rad-spring-details-height')
    }
  }
}

export function bindDialogMotion(host: HTMLElement, initial: MotionProfile): MotionHostBinding {
  const node = host as HTMLDialogElement
  let profile = initial
  const query = node.ownerDocument.defaultView!.matchMedia('(prefers-reduced-motion: reduce)')
  let open = node.open
  const geometry = () => ({
    left: node.offsetLeft,
    top: node.offsetTop,
    width: node.offsetWidth,
    height: node.offsetHeight,
    variables: Array.from(getComputedStyle(node))
      .filter(key => key.startsWith('--'))
      .map(key => [key, getComputedStyle(node).getPropertyValue(key)])
  })
  let bounds = node.open ? geometry() : null
  let ghost: HTMLDivElement | null = null
  const spring = createSpring(open ? 1 : 0.94, {
    ...resolveMotion(profile, 'dialog', query.matches),
    reducedValue: open ? 1 : 0.94
  })
  const unbind = bindSpringStyle(node, spring, 'scale')
  function clear() {
    ghost?.remove()
    ghost = null
  }
  function snapshot() {
    clear()
    if (!bounds || bounds.width === 0) return
    if (
      node.parentElement?.closest('dialog[open]') ||
      Array.from(node.querySelectorAll('*')).some(
        child =>
          child.localName.includes('-') ||
          /^(script|style|link|iframe|object|embed|canvas|video|audio)$/.test(child.localName)
      )
    )
      return
    const copy = node.cloneNode(true) as HTMLDialogElement
    ghost = node.ownerDocument.createElement('div')
    for (const attribute of copy.attributes) ghost.setAttribute(attribute.name, attribute.value)
    while (copy.firstChild) ghost.append(copy.firstChild)
    ghost.setAttribute('open', '')
    ghost.removeAttribute('data-slot')
    ghost.setAttribute('role', 'presentation')
    ghost.setAttribute('data-state', 'open')
    ghost.inert = true
    ghost.setAttribute('aria-hidden', 'true')
    ghost.setAttribute('data-rad-motion-exit', '')
    for (const child of [ghost, ...ghost.querySelectorAll('*')]) {
      for (const attribute of Array.from(child.attributes))
        if (attribute.name.toLowerCase().startsWith('on')) child.removeAttribute(attribute.name)
      for (const attribute of ['id', 'name', 'form', 'autofocus']) child.removeAttribute(attribute)
      if (
        child instanceof HTMLInputElement ||
        child instanceof HTMLButtonElement ||
        child instanceof HTMLSelectElement ||
        child instanceof HTMLTextAreaElement
      )
        child.disabled = true
    }
    for (const [key, value] of bounds.variables) ghost.style.setProperty(key, value)
    ghost.style.font = getComputedStyle(node).font
    ghost.style.colorScheme = getComputedStyle(node).colorScheme
    Object.assign(ghost.style, {
      position: 'fixed',
      margin: '0px',
      left: `${bounds.left}px`,
      top: `${bounds.top}px`,
      width: `${bounds.width}px`,
      height: `${bounds.height}px`,
      maxHeight: 'none',
      pointerEvents: 'none',
      zIndex: '2147483647',
      transition: 'none'
    })
    node.ownerDocument.body.append(ghost)
  }
  const off = spring.subscribe(value => {
    if (ghost) {
      ghost.style.scale = String(Math.max(0, value))
      ghost.style.opacity = String(Math.max(0, Math.min(1, (value - 0.94) / 0.06)))
      if (!node.open && Math.abs(value - 0.94) < 0.0001) clear()
    }
  })
  function sync() {
    if (node.open === open) return
    open = node.open
    const enabled = resolveMotion(profile, 'dialog', query.matches).enabled
    if (open) {
      clear()
      bounds = geometry()
      spring.configure({ reducedValue: 1 })
      spring.to(1)
    } else {
      if (enabled) snapshot()
      spring.configure({ reducedValue: 0.94 })
      spring.to(0.94)
      if (!enabled) clear()
    }
  }
  const beforeToggle = () => {
    if (node.open) bounds = geometry()
  }
  node.addEventListener('beforetoggle', beforeToggle)
  const observer = new MutationObserver(sync)
  observer.observe(node, { attributes: true, attributeFilter: ['open'] })
  const resize = new ResizeObserver(() => {
    if (node.open) bounds = geometry()
  })
  resize.observe(node)
  function update(next: MotionProfile) {
    profile = next
    spring.configure({
      ...resolveMotion(profile, 'dialog', query.matches),
      reducedValue: node.open ? 1 : 0.94
    })
    if (!resolveMotion(profile, 'dialog', query.matches).enabled) clear()
    sync()
  }
  const preference = () => update(profile)
  query.addEventListener('change', preference)
  return {
    update,
    destroy() {
      observer.disconnect()
      resize.disconnect()
      query.removeEventListener('change', preference)
      off()
      spring.destroy()
      unbind()
      node.removeEventListener('beforetoggle', beforeToggle)
      clear()
    }
  }
}

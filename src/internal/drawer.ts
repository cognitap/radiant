export type DrawerSide = 'top' | 'right' | 'bottom' | 'left' | 'start' | 'end'
export function drawerPoints(points: readonly number[]) {
  if (!points.length || points.some(point => !Number.isFinite(point) || point <= 0 || point > 1))
    throw new TypeError('Drawer snap points must be fractions greater than zero and at most one.')
  return [...new Set(points)].sort((a, b) => a - b)
}
export interface DrawerDriver {
  get(): number
  jump(value: number): void
  to(value: number): void
  subscribe(listener: (value: number) => void): () => void
  destroy(): void
}
export interface DrawerDragDriver extends DrawerDriver {
  begin(): void
  move(value: number, time: number): void
  release(time: number): { target: number }
  cancel(): void
  configure(options: { min: number; max: number; snapPoints: readonly number[] }): void
}
export interface DrawerOptions {
  side: DrawerSide
  snapPoint: number
  snapPoints: readonly number[]
  motion: 'inherit' | 'off'
  request(point: number): void
  dismiss(): void
}
export interface DrawerBinding {
  update(options: DrawerOptions): void
  destroy(): void
}
/** Functional fallback without the optional spring engine. */
export function immediateDrawerDriver(initial: number): DrawerDragDriver {
  let value = initial,
    previous = initial,
    points: readonly number[] = [0, 1]
  const listeners = new Set<(value: number) => void>()
  const jump = (next: number) => {
    value = Math.max(0, Math.min(1, next))
    listeners.forEach(listener => listener(value))
  }
  return {
    get: () => value,
    jump,
    to: jump,
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    begin() {
      previous = value
    },
    move: jump,
    release() {
      const target = points.reduce(
        (best, point) => (Math.abs(point - value) < Math.abs(best - value) ? point : best),
        points[0]
      )
      jump(target)
      return { target }
    },
    cancel() {
      jump(previous)
    },
    configure(options) {
      points = options.snapPoints
    },
    destroy() {
      listeners.clear()
    }
  }
}
/** Native handle events and geometry; injected drivers own presentation only. */
export function bindDrawer(
  node: HTMLDialogElement,
  initial: DrawerOptions,
  drag: DrawerDragDriver = immediateDrawerDriver(initial.snapPoint),
  entry: DrawerDriver = immediateDrawerDriver(1)
): DrawerBinding {
  const view = node.ownerDocument.defaultView!,
    doc = node.ownerDocument
  let options = initial,
    open = false,
    extent = 1,
    destroyed = false
  let physical: Exclude<DrawerSide, 'start' | 'end'> = 'right'
  let gesture: {
    id: number
    x: number
    y: number
    point: number
    handle: HTMLElement
    active: boolean
  } | null = null
  let suppressClick = false
  const variables = ['--_rad-drawer-shift', '--_rad-drawer-visible'] as const
  const saved = variables.map(key => node.style.getPropertyValue(key))
  const horizontal = () => physical === 'left' || physical === 'right'
  const sign = () => (physical === 'bottom' || physical === 'right' ? 1 : -1)
  function render() {
    // showModal() runs its native focus algorithm before the open observer fires.
    // Leave a closed viewport at its CSS size so those targets are eligible.
    if (!node.hasAttribute('open')) {
      node.style.setProperty('--_rad-drawer-shift', '0%')
      node.style.removeProperty('--_rad-drawer-visible')
      return
    }
    const fraction = Math.max(0, Math.min(1, drag.get()))
    node.style.setProperty(
      '--_rad-drawer-shift',
      `${sign() * (1 - fraction * Math.max(0, Math.min(1, entry.get()))) * 100}%`
    )
    const css = view.getComputedStyle(node)
    const border =
      parseFloat(
        css[
          physical === 'bottom'
            ? 'borderTopWidth'
            : physical === 'top'
              ? 'borderBottomWidth'
              : physical === 'right'
                ? 'borderLeftWidth'
                : 'borderRightWidth'
        ]
      ) || 0
    node.style.setProperty('--_rad-drawer-visible', `${Math.max(0, extent * fraction - border)}px`)
  }
  const offDrag = drag.subscribe(render),
    offEntry = entry.subscribe(render)
  function cancel() {
    const prior = gesture
    gesture = null
    node.removeAttribute('data-dragging')
    if (prior?.active) {
      drag.cancel()
      drag.to(options.snapPoint)
      suppressClick = true
    }
    if (prior?.handle.hasPointerCapture(prior.id)) prior.handle.releasePointerCapture(prior.id)
  }
  function sync() {
    if (destroyed) return
    const rtl = view.getComputedStyle(node).direction === 'rtl'
    const side =
      options.side === 'start'
        ? rtl
          ? 'right'
          : 'left'
        : options.side === 'end'
          ? rtl
            ? 'left'
            : 'right'
          : options.side
    if (side !== physical) {
      cancel()
      physical = side
    }
    node.setAttribute('data-physical-side', physical)
    const nextOpen = node.hasAttribute('open')
    if (nextOpen) {
      const rect = node.getBoundingClientRect()
      extent = Math.max(1, horizontal() ? rect.width : rect.height)
    }
    drag.configure({ min: 0, max: 1, snapPoints: [0, ...options.snapPoints] })
    if (nextOpen !== open) {
      cancel()
      drag.jump(options.snapPoint)
      entry.jump(nextOpen ? 0 : 1)
      if (nextOpen) entry.to(1)
      open = nextOpen
    } else if (!gesture?.active) drag.to(options.snapPoint)
    render()
  }
  function targetHandle(event: Event) {
    const target = event.target
    if (!(target instanceof view.Element)) return null
    const handle = target.closest<HTMLElement>('[data-slot~="drawer-handle"]')
    return handle?.closest('dialog') === node ? handle : null
  }
  function down(event: PointerEvent) {
    const handle = targetHandle(event)
    if (!handle || !open) return
    suppressClick = false
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      !event.isPrimary ||
      handle.matches(':disabled,[aria-disabled="true"],[aria-busy="true"]')
    )
      return
    cancel()
    gesture = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      point: drag.get(),
      handle,
      active: false
    }
  }
  function move(event: PointerEvent) {
    const current = gesture
    if (!current || current.id !== event.pointerId) return
    if (event.defaultPrevented) {
      cancel()
      return
    }
    const dx = event.clientX - current.x,
      dy = event.clientY - current.y
    const delta = horizontal() ? dx : dy,
      cross = horizontal() ? dy : dx
    if (!current.active) {
      if (Math.abs(cross) > 8 && Math.abs(cross) > Math.abs(delta)) {
        cancel()
        return
      }
      if (Math.abs(delta) < 4) return
      current.active = true
      drag.begin()
      current.handle.setPointerCapture(event.pointerId)
      node.setAttribute('data-dragging', '')
    }
    event.preventDefault()
    drag.move(current.point - (sign() * delta) / extent, event.timeStamp)
  }
  function up(event: PointerEvent) {
    const current = gesture
    if (!current || current.id !== event.pointerId) return
    if (event.defaultPrevented) {
      cancel()
      return
    }
    gesture = null
    node.removeAttribute('data-dragging')
    if (current.active) {
      suppressClick = true
      const { target } = drag.release(event.timeStamp)
      if (target === 0) options.dismiss()
      else options.request(target)
      // Controlled owners may refuse without causing another render.
      view.queueMicrotask(() => {
        if (!destroyed && node.hasAttribute('open')) drag.to(options.snapPoint)
      })
    }
    if (current.handle.hasPointerCapture(current.id))
      current.handle.releasePointerCapture(current.id)
  }
  function click(event: MouseEvent) {
    if (suppressClick && targetHandle(event)) {
      suppressClick = false
      event.preventDefault()
      event.stopImmediatePropagation()
    }
  }
  function key(event: KeyboardEvent) {
    if (event.key === 'Escape' && gesture?.active && !event.defaultPrevented) {
      event.preventDefault()
      cancel()
    }
  }
  function lost(event: PointerEvent) {
    // Touch implicitly captures the inner span first; transferring that capture
    // to the actual Button must not cancel the new gesture.
    if (event.type === 'lostpointercapture' && event.target !== gesture?.handle) return
    if (gesture?.id === event.pointerId) cancel()
  }
  const observer = new view.MutationObserver(sync)
  observer.observe(node, { attributes: true, attributeFilter: ['open'] })
  const direction = new view.MutationObserver(() => {
    const rtl = view.getComputedStyle(node).direction === 'rtl'
    const expected =
      options.side === 'start'
        ? rtl
          ? 'right'
          : 'left'
        : options.side === 'end'
          ? rtl
            ? 'left'
            : 'right'
          : options.side
    if (physical !== expected) sync()
  })
  for (let ancestor: HTMLElement | null = node; ancestor; ancestor = ancestor.parentElement)
    direction.observe(ancestor, { attributes: true, attributeFilter: ['dir', 'class', 'style'] })
  const resize = new view.ResizeObserver(sync)
  resize.observe(node)
  doc.addEventListener('pointerdown', down)
  doc.addEventListener('pointermove', move, { passive: false })
  doc.addEventListener('pointerup', up)
  doc.addEventListener('pointercancel', lost)
  doc.addEventListener('lostpointercapture', lost)
  doc.addEventListener('click', click, true)
  doc.addEventListener('keydown', key)
  view.addEventListener('blur', cancel)
  view.addEventListener('resize', sync)
  sync()
  return {
    update(next) {
      if (
        next.side !== options.side ||
        next.snapPoint !== options.snapPoint ||
        next.snapPoints.join() !== options.snapPoints.join()
      )
        cancel()
      options = next
      sync()
    },
    destroy() {
      destroyed = true
      cancel()
      observer.disconnect()
      direction.disconnect()
      resize.disconnect()
      doc.removeEventListener('pointerdown', down)
      doc.removeEventListener('pointermove', move)
      doc.removeEventListener('pointerup', up)
      doc.removeEventListener('pointercancel', lost)
      doc.removeEventListener('lostpointercapture', lost)
      doc.removeEventListener('click', click, true)
      doc.removeEventListener('keydown', key)
      view.removeEventListener('blur', cancel)
      view.removeEventListener('resize', sync)
      offDrag()
      offEntry()
      drag.destroy()
      entry.destroy()
      variables.forEach((key, index) =>
        saved[index] ? node.style.setProperty(key, saved[index]) : node.style.removeProperty(key)
      )
      node.removeAttribute('data-physical-side')
    }
  }
}

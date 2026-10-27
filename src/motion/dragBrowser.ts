import type { SpringDragController } from './drag.js'
import { bindSpringStyle } from './browser.js'
/** Bind one dedicated handle. Document bubble handlers let React/native consumers cancel first. */
export function bindSpringDrag(
  node: HTMLElement,
  controller: SpringDragController,
  axis: 'x' | 'y' = 'x'
) {
  const document = node.ownerDocument
  const unbind = bindSpringStyle(node, controller, axis === 'x' ? 'translateX' : 'translateY')
  const previousTouch = node.style.touchAction
  const ownsTouch = !previousTouch
  if (ownsTouch) node.style.touchAction = axis === 'x' ? 'pan-y' : 'pan-x'
  const ownedTouch = node.style.touchAction
  let active: number | undefined,
    start = 0,
    origin = 0,
    cross = 0,
    moved = false,
    suppress = false
  const coordinate = (event: PointerEvent) => (axis === 'x' ? event.clientX : event.clientY)
  const other = (event: PointerEvent) => (axis === 'x' ? event.clientY : event.clientX)
  const blocked = () =>
    node.matches(':disabled') ||
    node.getAttribute('aria-busy') === 'true' ||
    node.getAttribute('aria-disabled') === 'true'
  const target = (event: Event) => event.target instanceof Node && node.contains(event.target)
  function free() {
    if (active !== undefined && node.hasPointerCapture(active)) node.releasePointerCapture(active)
    active = undefined
  }
  function down(event: PointerEvent) {
    if (
      event.defaultPrevented ||
      !target(event) ||
      event.button !== 0 ||
      event.isPrimary === false ||
      active !== undefined ||
      blocked()
    )
      return
    suppress = false
    active = event.pointerId
    start = coordinate(event)
    cross = other(event)
    origin = controller.get()
    moved = false
    controller.begin()
    controller.move(origin, event.timeStamp)
  }
  function move(event: PointerEvent) {
    if (active !== event.pointerId) return
    if (event.defaultPrevented || blocked()) {
      cancel()
      return
    }
    const delta = coordinate(event) - start
    if (!moved && Math.abs(other(event) - cross) > Math.max(4, Math.abs(delta))) {
      cancel()
      return
    }
    if (!moved && Math.abs(delta) < 3) return
    if (!moved) {
      moved = true
      try {
        node.setPointerCapture(event.pointerId)
      } catch {
        /* Document events still provide outside release for synthetic input. */
      }
    }
    controller.move(origin + delta, event.timeStamp)
  }
  function up(event: PointerEvent) {
    if (active !== event.pointerId) return
    if (event.defaultPrevented || blocked()) {
      cancel()
      return
    }
    suppress = moved
    controller.release(event.timeStamp)
    free()
    moved = false
  }
  function cancel() {
    if (active === undefined) return
    controller.cancel()
    free()
    suppress = moved
  }
  function cancelled(event: PointerEvent) {
    if (active === event.pointerId) cancel()
  }
  function key(event: KeyboardEvent) {
    if (!target(event) || event.defaultPrevented || blocked()) return
    const backward = axis === 'x' ? 'ArrowLeft' : 'ArrowUp',
      forward = axis === 'x' ? 'ArrowRight' : 'ArrowDown'
    if (event.key === 'Escape') {
      if (active !== undefined) {
        event.preventDefault()
        cancel()
      }
      return
    }
    if ([backward, forward, 'Home', 'End'].includes(event.key)) {
      event.preventDefault()
      if (active !== undefined) cancel()
      controller.step(
        event.key === 'Home'
          ? 'first'
          : event.key === 'End'
            ? 'last'
            : event.key === forward
              ? 1
              : -1
      )
    }
  }
  function click(event: MouseEvent) {
    if (suppress) {
      suppress = false
      event.preventDefault()
      event.stopPropagation()
    }
  }
  document.addEventListener('pointerdown', down)
  document.addEventListener('pointermove', move)
  document.addEventListener('pointerup', up)
  document.addEventListener('pointercancel', cancelled)
  document.addEventListener('keydown', key)
  node.addEventListener('lostpointercapture', cancelled)
  node.addEventListener('click', click, true)
  document.defaultView!.addEventListener('blur', cancel)
  node.addEventListener('blur', cancel)
  const observer = new MutationObserver(() => {
    if (blocked()) cancel()
  })
  observer.observe(node, {
    attributes: true,
    attributeFilter: ['disabled', 'aria-busy', 'aria-disabled']
  })
  for (let parent = node.parentElement; parent; parent = parent.parentElement)
    if (parent.tagName === 'FIELDSET')
      observer.observe(parent, { attributes: true, attributeFilter: ['disabled'] })
  return () => {
    cancel()
    unbind()
    if (ownsTouch && node.style.touchAction === ownedTouch) node.style.touchAction = previousTouch
    document.removeEventListener('pointerdown', down)
    document.removeEventListener('pointermove', move)
    document.removeEventListener('pointerup', up)
    document.removeEventListener('pointercancel', cancelled)
    document.removeEventListener('keydown', key)
    node.removeEventListener('lostpointercapture', cancelled)
    node.removeEventListener('click', click, true)
    document.defaultView!.removeEventListener('blur', cancel)
    node.removeEventListener('blur', cancel)
    observer.disconnect()
  }
}

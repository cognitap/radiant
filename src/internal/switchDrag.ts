export interface SwitchDragBinding {
  start(event: PointerEvent): void
  escape(event: KeyboardEvent): boolean
  reconcile(): void
  dispose(): void
}

type Gesture = {
  pointer: number
  x: number
  y: number
  checked: boolean
  direction: number
  travel: number
  cssTravel: number
  progress: number
  moved: boolean
  transform: string
  form: HTMLFormElement | null
  cleanup(): void
}

/** Preview on a private thumb wrapper; commit through the input's native activation. */
export function bindSwitchDrag(
  input: HTMLInputElement,
  rail: HTMLElement,
  handle: HTMLElement
): SwitchDragBinding {
  const document = input.ownerDocument
  const view = document.defaultView!
  let gesture: Gesture | null = null
  let suppressClick = false
  const blocked = () => input.matches(':disabled') || !input.isConnected
  const metrics = () => ({
    travel: Math.max(0, rail.getBoundingClientRect().width - handle.getBoundingClientRect().width),
    cssTravel: Math.max(
      0,
      parseFloat(view.getComputedStyle(rail).width) -
        parseFloat(view.getComputedStyle(handle).width)
    ),
    direction: view.getComputedStyle(rail).direction === 'rtl' ? -1 : 1
  })
  function finish() {
    const current = gesture
    if (!current) return
    gesture = null
    suppressClick = current.moved
    current.cleanup()
    handle.style.transform = current.transform
    input.removeAttribute('data-dragging')
    if (input.hasPointerCapture(current.pointer)) input.releasePointerCapture(current.pointer)
    return current
  }
  const cancel = () => {
    finish()
  }
  function move(event: PointerEvent) {
    const current = gesture
    if (!current || current.pointer !== event.pointerId) return
    if (event.defaultPrevented || blocked() || input.checked !== current.checked) {
      cancel()
      return
    }
    const dx = event.clientX - current.x
    if (!current.moved && Math.abs(event.clientY - current.y) > Math.max(4, Math.abs(dx))) {
      cancel()
      return
    }
    if (!current.moved && Math.abs(dx) < 3) return
    if (!current.moved) {
      current.moved = true
      input.focus({ preventScroll: true })
      if (gesture !== current) return
      input.setAttribute('data-dragging', '')
      try {
        input.setPointerCapture(current.pointer)
      } catch {
        /* Owner-document events retain outside release. */
      }
    }
    if (gesture !== current) return
    event.preventDefault()
    current.progress = Math.max(
      0,
      Math.min(1, Number(current.checked) + (dx * current.direction) / current.travel)
    )
    handle.style.transform = `translateX(${(current.progress - Number(current.checked)) * current.cssTravel * current.direction}px)`
  }
  function up(event: PointerEvent) {
    const current = gesture
    if (!current || current.pointer !== event.pointerId) return
    if (event.defaultPrevented || blocked() || input.checked !== current.checked) {
      cancel()
      return
    }
    // A release can contain a final coordinate without a preceding move sample.
    if (current.moved) move(event)
    const ended = finish()
    if (!ended?.moved) return
    const next = ended.progress === 0.5 ? ended.checked : ended.progress > 0.5
    if (next !== input.checked) input.click()
  }
  function pointerCancelled(event: PointerEvent) {
    if (gesture?.pointer === event.pointerId) cancel()
  }
  function click(event: MouseEvent) {
    // Native keyboard/programmatic activation has detail 0, including our commit.
    if (!suppressClick || event.detail === 0) return
    suppressClick = false
    event.preventDefault()
    event.stopPropagation()
  }
  input.addEventListener('click', click, true)
  return {
    start(event) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.isPrimary === false ||
        gesture ||
        blocked()
      )
        return
      suppressClick = false
      const measured = metrics()
      if (!(measured.travel > 0 && measured.cssTravel > 0)) return
      const observer = new view.MutationObserver(() => {
        if (blocked()) cancel()
      })
      observer.observe(input, { attributes: true, attributeFilter: ['disabled'] })
      for (let parent = input.parentElement; parent; parent = parent.parentElement)
        if (parent.tagName === 'FIELDSET')
          observer.observe(parent, { attributes: true, attributeFilter: ['disabled'] })
      const form = input.form
      gesture = {
        pointer: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        checked: input.checked,
        ...measured,
        progress: Number(input.checked),
        moved: false,
        transform: handle.style.transform,
        form,
        cleanup() {
          document.removeEventListener('pointermove', move)
          document.removeEventListener('pointerup', up)
          document.removeEventListener('pointercancel', pointerCancelled)
          input.removeEventListener('lostpointercapture', pointerCancelled)
          input.removeEventListener('blur', cancel)
          form?.removeEventListener('reset', cancel)
          view.removeEventListener('blur', cancel)
          view.removeEventListener('resize', cancel)
          observer.disconnect()
        }
      }
      document.addEventListener('pointermove', move, { passive: false })
      document.addEventListener('pointerup', up)
      document.addEventListener('pointercancel', pointerCancelled)
      input.addEventListener('lostpointercapture', pointerCancelled)
      input.addEventListener('blur', cancel)
      form?.addEventListener('reset', cancel)
      view.addEventListener('blur', cancel)
      view.addEventListener('resize', cancel)
    },
    escape(event) {
      if (!gesture || event.defaultPrevented || event.key !== 'Escape') return false
      cancel()
      return true
    },
    reconcile() {
      if (!gesture) return
      const measured = metrics()
      if (
        blocked() ||
        input.checked !== gesture.checked ||
        input.form !== gesture.form ||
        measured.direction !== gesture.direction ||
        Math.abs(measured.travel - gesture.travel) > 0.5
      )
        cancel()
    },
    dispose() {
      cancel()
      input.removeEventListener('click', click, true)
    }
  }
}

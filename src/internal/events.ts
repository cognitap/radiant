type CancellableEvent = { defaultPrevented: boolean; preventDefault(): void }

/** Activation guards precede the consumer, who can cancel the library action. */
export function composeAction<Event extends CancellableEvent>(
  consumer: ((event: Event) => void) | undefined,
  action: ((event: Event) => void) | undefined,
  blocked?: (event: Event) => boolean
) {
  return (event: Event) => {
    if (blocked?.(event)) {
      event.preventDefault()
      return
    }
    consumer?.(event)
    if (!event.defaultPrevented) action?.(event)
  }
}

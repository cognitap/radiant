export function validateToastDuration(value: number) {
  if (!Number.isFinite(value) || value < 0 || value > 2_147_483_647)
    throw new TypeError('Toast duration must be between 0 and 2147483647 milliseconds.')
}

/** A paused interval retains its remaining time; an elapsed interval fires once. */
export function createToastTimer(
  duration: number,
  clock: {
    now(): number
    set(callback: () => void, delay: number): number
    clear(id: number): void
  },
  elapsed: () => void
) {
  validateToastDuration(duration)
  let remaining = duration
  let deadline = 0
  let timer: number | undefined
  let ended = false
  const pause = () => {
    if (timer === undefined) return
    clock.clear(timer)
    timer = undefined
    remaining = Math.max(0, deadline - clock.now())
  }
  return {
    pause,
    resume() {
      if (!duration || ended || timer !== undefined) return
      deadline = clock.now() + remaining
      timer = clock.set(() => {
        timer = undefined
        ended = true
        elapsed()
      }, remaining)
    },
    destroy() {
      pause()
      ended = true
    }
  }
}

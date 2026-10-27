import { createSpring, type SpringController, type SpringOptions } from './runtime.js'
export interface SpringDragOptions extends SpringOptions {
  readonly min: number
  readonly max: number
  readonly snapPoints?: readonly number[]
}
export interface SpringDragController extends SpringController {
  begin(): void
  move(position: number, time: number): void
  release(time: number): { target: number; velocity: number }
  cancel(): void
  step(direction: -1 | 1 | 'first' | 'last'): void
  configure(options: Partial<SpringDragOptions>): void
}
function validated(input: SpringDragOptions) {
  if (!Number.isFinite(input.min) || !Number.isFinite(input.max) || input.min >= input.max)
    throw new TypeError('Drag bounds must be finite and min < max.')
  if (input.reducedValue !== undefined)
    throw new TypeError('Drag off snaps to its functional goal, not a decorative reducedValue.')
  const points = input.snapPoints ?? [input.min, input.max]
  if (
    !Array.isArray(points) ||
    !points.length ||
    points.some(value => !Number.isFinite(value) || value < input.min || value > input.max)
  )
    throw new TypeError('Snap points must be a nonempty array within bounds.')
  return { ...input, snapPoints: [...new Set(points)].sort((a, b) => a - b) }
}
/** One axis, local pixels; Motion supplies all spring physics. */
export function createSpringDrag(initial: number, input: SpringDragOptions): SpringDragController {
  let options = validated(input)
  const clamp = (value: number) => Math.max(options.min, Math.min(options.max, value))
  if (!Number.isFinite(initial) || initial < options.min || initial > options.max)
    throw new TypeError('Initial drag position must be within bounds.')
  const spring = createSpring(initial, options)
  let goal = initial,
    cancelGoal = initial,
    dragging = false,
    velocity = 0,
    lastTime: number | undefined,
    lastPosition = initial,
    destroyed = false
  const choose = (position: number) =>
    options.snapPoints.reduce(
      (best, point) => (Math.abs(point - position) < Math.abs(best - position) ? point : best),
      options.snapPoints[0]
    )
  const to = (target: number, speed?: number) => {
    if (!Number.isFinite(target)) throw new TypeError('Drag target must be finite.')
    if (destroyed) return
    goal = clamp(target)
    spring.to(goal, speed)
  }
  const controller: SpringDragController = {
    get: () => clamp(spring.get()),
    getVelocity: () =>
      spring.get() < options.min || spring.get() > options.max ? 0 : spring.getVelocity(),
    isAnimating: () => spring.isAnimating(),
    to,
    jump(target) {
      if (!Number.isFinite(target)) throw new TypeError('Drag target must be finite.')
      if (destroyed) return
      goal = clamp(target)
      spring.jump(goal)
    },
    stop() {
      if (destroyed) return
      spring.stop()
      goal = controller.get()
    },
    subscribe(listener) {
      return spring.subscribe(() => listener(controller.get()))
    },
    configure(next) {
      if (destroyed) return
      const resolved = validated({ ...options, ...next })
      spring.configure(resolved)
      options = resolved
      goal = clamp(goal)
      cancelGoal = clamp(cancelGoal)
      if (dragging) spring.jump(controller.get())
      else spring.to(goal)
    },
    begin() {
      if (destroyed) return
      cancelGoal = goal
      dragging = true
      lastTime = undefined
      velocity = 0
      lastPosition = controller.get()
      spring.jump(lastPosition)
    },
    move(position, time) {
      if (!Number.isFinite(position) || !Number.isFinite(time))
        throw new TypeError('Drag samples need finite pixel positions and millisecond times.')
      if (!dragging || destroyed) return
      const current = clamp(position)
      if (lastTime !== undefined) {
        const dt = time - lastTime
        velocity =
          dt > 0 && dt <= 80
            ? Math.max(-3000, Math.min(3000, ((current - lastPosition) * 1000) / dt))
            : 0
      }
      lastTime = time
      lastPosition = current
      spring.jump(current)
    },
    release(time) {
      if (!Number.isFinite(time)) throw new TypeError('Release time must be finite.')
      if (!dragging || destroyed) return { target: goal, velocity: 0 }
      dragging = false
      const speed =
        options.enabled === false ||
        lastTime === undefined ||
        time - lastTime > 80 ||
        time < lastTime
          ? 0
          : velocity
      const target = choose(clamp(controller.get() + speed * 0.18))
      to(target, speed)
      return { target, velocity: speed }
    },
    cancel() {
      if (!dragging || destroyed) return
      dragging = false
      to(cancelGoal, 0)
    },
    step(direction) {
      if (destroyed) return
      dragging = false
      const current = goal
      const points = options.snapPoints
      const target =
        direction === 'first'
          ? points[0]
          : direction === 'last'
            ? points.at(-1)!
            : direction === 1
              ? (points.find(point => point > current + 0.01) ?? points.at(-1)!)
              : ([...points].reverse().find(point => point < current - 0.01) ?? points[0])
      to(target)
    },
    destroy() {
      destroyed = true
      dragging = false
      spring.destroy()
    }
  }
  return controller
}

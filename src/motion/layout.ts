import { createSpring, type SpringOptions } from './runtime.js'

export interface LayoutBounds {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}
const axes = ['x', 'y', 'width', 'height'] as const
function validate(bounds: LayoutBounds) {
  for (const axis of axes) {
    if (
      !Number.isFinite(bounds[axis]) ||
      ((axis === 'width' || axis === 'height') && bounds[axis] < 0)
    )
      throw new TypeError(
        'Layout bounds require finite local pixel coordinates and nonnegative dimensions.'
      )
  }
}
/** Measured local-pixel foundation; measurement and host projection belong to the layout adapter. */
export function createLayoutSpring(initial: LayoutBounds, options: SpringOptions = {}) {
  validate(initial)
  if (options.reducedValue !== undefined)
    throw new TypeError('Layout off mode snaps to measured bounds; reducedValue is scalar only.')
  const values = {
    x: createSpring(initial.x, options),
    y: createSpring(initial.y, options),
    width: createSpring(initial.width, options),
    height: createSpring(initial.height, options)
  }
  return {
    get: (): LayoutBounds => ({
      x: values.x.get(),
      y: values.y.get(),
      width: values.width.get(),
      height: values.height.get()
    }),
    getVelocity: (): LayoutBounds => ({
      x: values.x.getVelocity(),
      y: values.y.getVelocity(),
      width: values.width.getVelocity(),
      height: values.height.getVelocity()
    }),
    isAnimating: () => axes.some(axis => values[axis].isAnimating()),
    to(next: LayoutBounds) {
      validate(next)
      axes.forEach(axis => values[axis].to(next[axis]))
    },
    jump(next: LayoutBounds) {
      validate(next)
      axes.forEach(axis => values[axis].jump(next[axis]))
    },
    configure(next: SpringOptions) {
      if (next.reducedValue !== undefined)
        throw new TypeError('Layout off mode snaps to measured bounds.')
      // Validate all options before changing any axis.
      axes.forEach(axis => values[axis].configure(next))
    },
    subscribe(listener: (bounds: LayoutBounds) => void) {
      const snapshot = () =>
        listener({
          x: values.x.get(),
          y: values.y.get(),
          width: values.width.get(),
          height: values.height.get()
        })
      const off = axes.map(axis => values[axis].subscribe(snapshot))
      return () => off.forEach(remove => remove())
    },
    stop() {
      axes.forEach(axis => values[axis].stop())
    },
    destroy() {
      axes.forEach(axis => values[axis].destroy())
    }
  }
}

import { expect, waitFor } from 'storybook/test'

/** Guard the rendered disabled-selection regression without moving Docs focus. */
export async function checkDisabledIndicators(
  canvasElement: HTMLElement,
  type: 'checkbox' | 'radio'
) {
  await waitFor(async () => {
    const document = canvasElement.ownerDocument
    const view = document.defaultView
    const context = document.createElement('canvas').getContext('2d')
    if (!view || !context) throw new Error('Indicator checks need a rendered document.')

    function rgba(value: string) {
      context!.clearRect(0, 0, 1, 1)
      context!.fillStyle = value
      context!.fillRect(0, 0, 1, 1)
      return [...context!.getImageData(0, 0, 1, 1).data]
    }
    function luminance(channels: number[]) {
      return channels.reduce((sum, channel, index) => {
        const value = channel / 255
        return (
          sum +
          (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4) *
            [0.2126, 0.7152, 0.0722][index]
        )
      }, 0)
    }
    function contrast(first: number, second: number) {
      return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
    }

    const inputs = [
      ...canvasElement.querySelectorAll<HTMLInputElement>(`input[type="${type}"]:disabled`)
    ].filter(input => input.checked || input.indeterminate)
    await expect(inputs.length).toBeGreaterThan(0)
    for (const input of inputs) {
      const marks = input.parentElement?.querySelectorAll<SVGElement | HTMLSpanElement>(
        '[aria-hidden="true"]'
      )
      const mark = marks?.[input.indeterminate ? 1 : 0]
      if (!mark) throw new Error('The selected disabled control has no visual mark.')
      const styles = view.getComputedStyle(mark)
      const inputBounds = input.getBoundingClientRect()
      const markBounds = mark.getBoundingClientRect()
      await expect(Number(styles.opacity)).toBeGreaterThan(0)
      await expect(markBounds.width).toBeGreaterThan(0)
      await expect(markBounds.height).toBeGreaterThan(0)
      await expect(
        Math.abs(markBounds.x + markBounds.width / 2 - inputBounds.x - inputBounds.width / 2)
      ).toBeLessThan(0.5)
      await expect(
        Math.abs(markBounds.y + markBounds.height / 2 - inputBounds.y - inputBounds.height / 2)
      ).toBeLessThan(0.5)

      const foreground = rgba(type === 'checkbox' ? styles.color : styles.backgroundColor)
      const background = rgba(view.getComputedStyle(input).backgroundColor)
      const alpha = background[3] / 255
      // Translucent fills may sit on a gradient. Require the local mark/fill pair
      // to stay legible over the whole possible underlying color range, rather
      // than treating transparent RGB channels as an opaque painted background.
      const minimum = luminance(background.slice(0, 3).map(channel => channel * alpha))
      const maximum = luminance(
        background.slice(0, 3).map(channel => channel * alpha + 255 * (1 - alpha))
      )
      const markLuminance = luminance(foreground.slice(0, 3))
      await expect(foreground[3]).toBe(255)
      const nearest = Math.max(minimum, Math.min(maximum, markLuminance))
      await expect(contrast(markLuminance, nearest)).toBeGreaterThanOrEqual(3)
    }
  })
}

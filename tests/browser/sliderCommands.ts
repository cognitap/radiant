import type { BrowserCommandContext } from 'vitest/node'
import type {} from '@vitest/browser-playwright'

/** Drive the browser-owned range thumb with real mouse/touch input. */
export async function dragSlider(
  context: BrowserCommandContext,
  selector: string,
  fraction: number,
  touch = false
) {
  const frame = await context.frame()
  const input = frame.locator(selector)
  await input.scrollIntoViewIfNeeded()
  const box = await input.boundingBox()
  if (!box) throw new Error('Slider is not visible')
  const state = await input.evaluate(node => {
    const range = node as HTMLInputElement
    const min = Number(range.min || 0),
      max = Number(range.max || 100)
    return {
      progress: (range.valueAsNumber - min) / (max - min),
      vertical: range.dataset.orientation === 'vertical',
      rtl: getComputedStyle(range).direction === 'rtl'
    }
  })
  const point = (progress: number) => ({
    x: state.vertical
      ? box.x + box.width / 2
      : box.x + 1 + (box.width - 2) * (state.rtl ? 1 - progress : progress),
    y: state.vertical ? box.y + 1 + (box.height - 2) * (1 - progress) : box.y + box.height / 2
  })
  const start = point(state.progress),
    end = point(fraction)
  if (touch) {
    const cdp = await context.page.context().newCDPSession(context.page)
    try {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ ...start, id: 1 }]
      })
      for (let i = 1; i <= 6; i++) {
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [
            {
              x: start.x + ((end.x - start.x) * i) / 6,
              y: start.y + ((end.y - start.y) * i) / 6,
              id: 1
            }
          ]
        })
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    } finally {
      await cdp.detach()
    }
  } else {
    await context.page.mouse.move(start.x, start.y)
    await context.page.mouse.down()
    try {
      await context.page.mouse.move(end.x, end.y, { steps: 6 })
    } finally {
      await context.page.mouse.up()
    }
  }
  return input.inputValue()
}

declare module 'vitest/browser' {
  interface BrowserCommands {
    dragSlider(selector: string, fraction: number, touch?: boolean): Promise<string>
  }
}

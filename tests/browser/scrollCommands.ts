import type { BrowserCommandContext } from 'vitest/node'
import type {} from '@vitest/browser-playwright'
/** Real browser input leaves scrolling with the platform, including over custom marks. */
export async function scrollViewport(
  context: BrowserCommandContext,
  selector: string,
  deltaX: number,
  deltaY: number,
  touch = false
) {
  const target = (await context.frame()).locator(selector)
  await target.scrollIntoViewIfNeeded()
  const box = await target.boundingBox()
  if (!box) throw new Error('Scroll target is not visible')
  if (!touch) {
    await target.hover()
    await context.page.mouse.wheel(deltaX, deltaY)
    return
  }
  const cdp = await context.page.context().newCDPSession(context.page)
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2
  try {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y, id: 1 }]
    })
    for (let step = 1; step <= 6; step++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: x - (deltaX * step) / 6, y: y - (deltaY * step) / 6, id: 1 }]
      })
      await context.page.waitForTimeout(16)
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  } finally {
    await cdp.detach()
  }
}
declare module 'vitest/browser' {
  interface BrowserCommands {
    scrollViewport(selector: string, deltaX: number, deltaY: number, touch?: boolean): Promise<void>
  }
}

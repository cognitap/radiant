import type { BrowserCommandContext } from 'vitest/node'
import type {} from '@vitest/browser-playwright'
export async function contextTouch(
  context: BrowserCommandContext,
  selector: string,
  duration: number,
  ending: 'end' | 'move' | 'cancel'
) {
  const frame = await context.frame(),
    element = frame.locator(selector)
  await element.scrollIntoViewIfNeeded()
  const box = await element.boundingBox()
  if (!box) throw new Error('Context target not visible')
  const cdp = await context.page.context().newCDPSession(context.page),
    x = box.x + box.width / 2,
    y = box.y + box.height / 2
  try {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y, id: 1 }]
    })
    await context.page.waitForTimeout(duration)
    if (ending === 'move') {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: x + 60, y: y + 60, id: 1 }]
      })
      await context.page.waitForTimeout(30)
    }
    await cdp.send('Input.dispatchTouchEvent', {
      type: ending === 'cancel' ? 'touchCancel' : 'touchEnd',
      touchPoints: []
    })
  } finally {
    await cdp.detach()
  }
}
declare module 'vitest/browser' {
  interface BrowserCommands {
    contextTouch(
      selector: string,
      duration: number,
      ending: 'end' | 'move' | 'cancel'
    ): Promise<void>
  }
}

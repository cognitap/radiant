import type { BrowserCommandContext } from 'vitest/node'
import type {} from '@vitest/browser-playwright'
export async function touchButton(
  context: BrowserCommandContext,
  selector: string,
  cancel: boolean
) {
  const frame = await context.frame()
  const element = frame.locator(selector)
  await element.scrollIntoViewIfNeeded()
  const box = await element.boundingBox()
  if (!box) throw new Error('Touch target is not visible')
  const cdp = await context.page.context().newCDPSession(context.page)
  try {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 }]
    })
    await context.page.waitForTimeout(80)
    const pressed = await element.evaluate(node => Number((node as HTMLElement).style.scale) < 1)
    await cdp.send('Input.dispatchTouchEvent', {
      type: cancel ? 'touchCancel' : 'touchEnd',
      touchPoints: []
    })
    return pressed
  } finally {
    await cdp.detach()
  }
}
declare module 'vitest/browser' {
  interface BrowserCommands {
    touchButton(selector: string, cancel: boolean): Promise<boolean>
  }
}

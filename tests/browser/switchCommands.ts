import type { BrowserCommandContext } from 'vitest/node'
import type {} from '@vitest/browser-playwright'

type Phase = 'release' | 'cancel' | 'hold' | 'finish' | 'escape' | 'lostcapture'
export async function dragSwitch(
  context: BrowserCommandContext,
  selector: string,
  delta: number,
  phase: Phase = 'release',
  touch = false,
  deltaY = 0
) {
  if (phase === 'finish') {
    await context.page.mouse.up()
    return null
  }
  const frame = await context.frame()
  const control = frame.locator(selector)
  const thumb = control.locator('..').locator('[data-slot=switch-indicator]')
  await control.scrollIntoViewIfNeeded()
  const box = await thumb.boundingBox()
  if (!box) throw new Error('Switch thumb is not visible')
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2
  const sample = async () => ({
    checked: await control.isChecked(),
    thumb: await thumb.boundingBox(),
    dragging: await control.getAttribute('data-dragging'),
    captured: await control.evaluate(node => node.hasPointerCapture(1))
  })
  const before = await sample()
  const cdp = touch ? await context.page.context().newCDPSession(context.page) : null
  try {
    if (cdp) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x, y, id: 1 }]
      })
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: x + delta, y: y + deltaY, id: 1 }]
      })
    } else {
      await context.page.mouse.move(x, y)
      await context.page.mouse.down()
      await context.page.mouse.move(x + delta, y + deltaY, { steps: 6 })
    }
    const during = await sample()
    if (phase === 'hold') return { before, during }
    if (phase === 'escape') await context.page.keyboard.press('Escape')
    if (phase === 'lostcapture') await control.evaluate(node => node.releasePointerCapture(1))
    if (cdp)
      await cdp.send('Input.dispatchTouchEvent', {
        type: phase === 'cancel' ? 'touchCancel' : 'touchEnd',
        touchPoints: []
      })
    else {
      if (phase === 'cancel')
        await control.dispatchEvent('pointercancel', { pointerId: 1, bubbles: true })
      await context.page.mouse.up()
    }
    return { before, during }
  } finally {
    await cdp?.detach()
  }
}

declare module 'vitest/browser' {
  interface BrowserCommands {
    dragSwitch(
      selector: string,
      delta: number,
      phase?: Phase,
      touch?: boolean,
      deltaY?: number
    ): Promise<{
      before: {
        checked: boolean
        thumb: { x: number; y: number; width: number; height: number } | null
        dragging: string | null
        captured: boolean
      }
      during: {
        checked: boolean
        thumb: { x: number; y: number; width: number; height: number } | null
        dragging: string | null
        captured: boolean
      }
    } | null>
  }
}

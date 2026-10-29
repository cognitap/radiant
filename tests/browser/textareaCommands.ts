import type { BrowserCommandContext } from 'vitest/node'
import type {} from '@vitest/browser-playwright'

export async function resizeTextarea(
  context: BrowserCommandContext,
  selector: string,
  delta: number
) {
  const element = (await context.frame()).locator(selector)
  await element.scrollIntoViewIfNeeded()
  const box = await element.boundingBox()
  if (!box) throw new Error('Textarea is not visible')
  const x = box.x + box.width - 3,
    y = box.y + box.height - 3
  await context.page.mouse.move(x, y)
  await context.page.mouse.down()
  await context.page.mouse.move(x + 40, y + delta, { steps: 6 })
  await context.page.mouse.up()
}

declare module 'vitest/browser' {
  interface BrowserCommands {
    resizeTextarea(selector: string, delta: number): Promise<void>
  }
}

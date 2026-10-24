import type { BrowserCommandContext } from 'vitest/node'
import type {} from '@vitest/browser-playwright'

export async function observeLinkPopup(
  context: BrowserCommandContext,
  selector: string,
  activation: 'modified' | 'middle' | 'target'
) {
  const frame = await context.frame()
  const opened = context.context.waitForEvent('page', { timeout: 5000 })
  const click =
    activation === 'modified'
      ? frame.locator(selector).click({ modifiers: ['ControlOrMeta'] })
      : frame.locator(selector).click({ button: activation === 'middle' ? 'middle' : 'left' })
  const [popup] = await Promise.all([opened, click])
  try {
    await popup.waitForLoadState('domcontentloaded')
    return popup.url()
  } finally {
    await popup.close()
  }
}

export async function observeLinkDownload(context: BrowserCommandContext, selector: string) {
  const frame = await context.frame()
  const [download] = await Promise.all([
    context.page.waitForEvent('download', { timeout: 5000 }),
    frame.locator(selector).click()
  ])
  try {
    return { filename: download.suggestedFilename(), url: download.url() }
  } finally {
    await download.delete()
  }
}

declare module 'vitest/browser' {
  interface BrowserCommands {
    observeLinkPopup(
      selector: string,
      activation: 'modified' | 'middle' | 'target'
    ): Promise<string>
    observeLinkDownload(selector: string): Promise<{ filename: string; url: string }>
  }
}

import type { BrowserCommandContext } from 'vitest/node'
import type {} from '@vitest/browser-playwright'

type Preferences = Pick<
  NonNullable<Parameters<BrowserCommandContext['page']['emulateMedia']>[0]>,
  'colorScheme' | 'forcedColors' | 'reducedMotion'
>

export async function emulatePreferences(context: BrowserCommandContext, preferences: Preferences) {
  await context.page.emulateMedia(preferences)
}

declare module 'vitest/browser' {
  interface BrowserCommands {
    emulatePreferences(preferences: Preferences): Promise<void>
  }
}

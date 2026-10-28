import { fileURLToPath } from 'node:url'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'
import tailwindcss from '@tailwindcss/vite'
import { observeLinkDownload, observeLinkPopup } from './tests/browser/navigationCommands.js'
import { touchButton, dragHandle } from './tests/browser/touchCommands.js'
import { emulatePreferences } from './tests/browser/mediaCommands.js'
import { themes } from './src/examples/index.js'

export default defineConfig({
  test: {
    maxWorkers: 2,
    attachmentsDir: 'output/browser/attachments',
    reporters: [
      'default',
      [
        'junit',
        { outputFile: 'output/browser/junit.xml', classnameTemplate: '{displayName}:{filename}' }
      ]
    ],
    projects: [
      ...themes.flatMap(theme =>
        (['light', 'dark'] as const).map(mode => ({
          plugins: [
            storybookTest({
              configDir: fileURLToPath(new URL('./.storybook', import.meta.url)),
              initialGlobals: { theme: theme.id, mode }
            })
          ],
          test: {
            name: `storybook-${theme.id}-${mode}`,
            testTimeout: 15000,
            browser: {
              enabled: true,
              provider: playwright(),
              headless: true,
              screenshotFailures: true,
              instances: [{ browser: 'chromium' as const, viewport: { width: 1280, height: 900 } }]
            }
          }
        }))
      ),
      {
        plugins: [tailwindcss()],
        optimizeDeps: { include: ['@tanstack/react-form', 'cn', 'cn/config', 'react-dom'] },
        oxc: { jsx: { runtime: 'automatic' } },
        test: {
          name: 'browser-platform',
          include: ['tests/browser/**/*.test.tsx'],
          browser: {
            commands: {
              observeLinkDownload,
              observeLinkPopup,
              emulatePreferences,
              touchButton,
              dragHandle
            },
            enabled: true,
            provider: playwright(),
            headless: true,
            screenshotFailures: true,
            instances: [{ browser: 'chromium', viewport: { width: 1280, height: 900 } }]
          }
        }
      }
    ]
  }
})

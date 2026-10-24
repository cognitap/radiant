import { fileURLToPath } from 'node:url'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'
import tailwindcss from '@tailwindcss/vite'
import { themes } from './src/themes/index.js'

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
        oxc: { jsx: { runtime: 'automatic' } },
        test: {
          name: 'browser-platform',
          include: ['tests/browser/**/*.test.tsx'],
          browser: {
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

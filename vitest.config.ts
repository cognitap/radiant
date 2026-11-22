import { availableParallelism } from 'node:os'
import { fileURLToPath } from 'node:url'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'
import tailwindcss from '@tailwindcss/vite'
import { observeLinkDownload, observeLinkPopup } from './tests/browser/navigationCommands.js'
import { contextTouch } from './tests/browser/contextCommands.js'
import { touchButton, dragHandle } from './tests/browser/touchCommands.js'
import { dragSlider } from './tests/browser/sliderCommands.js'
import { scrollViewport } from './tests/browser/scrollCommands.js'
import { dragSwitch } from './tests/browser/switchCommands.js'
import { resizeTextarea } from './tests/browser/textareaCommands.js'
import { emulatePreferences } from './tests/browser/mediaCommands.js'
import { themes } from './src/examples/index.js'

export default defineConfig({
  test: {
    maxWorkers: availableParallelism(),
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
            isolate: false,
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
        optimizeDeps: {
          include: [
            '@tanstack/react-form',
            'cn',
            'react-dom',
            '@a2ui/web_core',
            '@a2ui/web_core/errors',
            '@a2ui/web_core/expressions',
            'lucide-react'
          ]
        },
        oxc: { jsx: { runtime: 'automatic' } },
        test: {
          name: 'browser-platform',
          include: ['tests/browser/**/*.test.tsx'],
          browser: {
            commands: {
              observeLinkDownload,
              observeLinkPopup,
              emulatePreferences,
              contextTouch,
              touchButton,
              dragHandle,
              resizeTextarea,
              dragSwitch,
              dragSlider,
              scrollViewport
            },
            enabled: true,
            provider: playwright(),
            headless: true,
            screenshotFailures: true,
            instances: [{ browser: 'chromium', viewport: { width: 1280, height: 900 } }]
          }
        }
      },
      {
        plugins: [tailwindcss()],
        optimizeDeps: {
          include: ['cn', 'react-dom', '@a2ui/web_core', '@a2ui/web_core/errors', 'lucide-react']
        },
        oxc: { jsx: { runtime: 'automatic' } },
        test: {
          name: 'visual',
          include: ['tests/visual/**/*.test.tsx'],
          browser: {
            commands: { emulatePreferences },
            enabled: true,
            provider: playwright({
              contextOptions: { locale: 'en-US', timezoneId: 'UTC' }
            }),
            headless: true,
            // Light and dark at 360px and 720px sit side by side in one screenshot.
            instances: [{ browser: 'chromium', viewport: { width: 2200, height: 1600 } }],
            expect: {
              toMatchScreenshot: {
                // Ignore anti-aliasing noise; a changed token or layout moves far more pixels.
                comparatorOptions: { threshold: 0.2, allowedMismatchedPixelRatio: 0.001 }
              }
            }
          }
        }
      }
    ]
  }
})

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeAll, expect, test, vi } from 'vitest'
import { commands, page } from 'vitest/browser'
import {
  A2uiMediaProvider,
  A2uiSurface,
  type A2uiMessage,
  type CatalogDiagnostic
} from '../../src/a2ui/index.js'
import { lucideA2uiIcons } from '../../src/a2ui/lucide.js'
import { themes } from '../../src/examples/index.js'
import { ThemeScope, ToastProvider, ToastViewport } from '../../src/index.js'
import { uncoveredItemAxes, unseeded, visualCases, VISUAL_SURFACE_ID } from './catalogMatrix.js'
import './visual.css'

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)

const theme = themes.find(t => t.id === 'radiant')!
const modes = ['light', 'dark'] as const
const widths = [360, 720] as const
const labels = {
  modalClose: 'Close',
  toastClose: 'Dismiss',
  revealPrevious: 'Previous',
  revealNext: 'Next',
  revealPosition: 'Step {index} of {count}'
}
const mounted: { host: HTMLElement; root: Root }[] = []

beforeAll(async () => {
  await commands.emulatePreferences({ reducedMotion: 'reduce' })
  await document.fonts.load('16px "Inter Variable"')
})

/** Waits until each video has its metadata or has given up, so its frame stops changing. */
const settleMedia = (host: HTMLElement) =>
  Promise.all(
    Array.from(host.querySelectorAll<HTMLMediaElement>('video, audio'), media =>
      media.readyState >= 1 || media.error
        ? undefined
        : new Promise(resolve => {
            media.addEventListener('loadedmetadata', resolve, { once: true })
            media.addEventListener('error', resolve, { once: true })
          })
    )
  )
afterEach(async () => {
  for (const { host, root } of mounted.splice(0)) {
    await act(async () => root.unmount())
    host.remove()
  }
})

test('every catalog component and item prop has a seed to vary', () => {
  expect(unseeded(), 'Add a seed in tests/visual/catalogMatrix.ts').toEqual([])
  expect(uncoveredItemAxes(), 'Give the seed a literal array for these props').toEqual([])
})

const file = (name: string) => name.replaceAll('/', '--').replaceAll('=', '-').replaceAll(',', '_')

test.each(visualCases().map(c => [c.name, c] as const))('%s', async (name, { messages }) => {
  const errors: CatalogDiagnostic[] = []
  const host = document.createElement('div')
  host.style.cssText = 'display:flex;align-items:flex-start;width:max-content'
  document.body.append(host)
  const root = createRoot(host)
  mounted.push({ host, root })
  const frames = modes.flatMap(mode => widths.map(width => ({ mode, width })))
  await act(async () =>
    root.render(
      <A2uiMediaProvider icons={lucideA2uiIcons}>
        {frames.map(({ mode, width }) => (
          <ThemeScope
            key={`${mode}-${width}`}
            theme={theme}
            mode={mode}
          >
            <div
              className="visual-frame"
              data-frame={`${mode}-${width}`}
              style={{ width }}
            >
              <ToastProvider>
                <A2uiSurface
                  surfaceId={VISUAL_SURFACE_ID}
                  messages={messages as readonly A2uiMessage[]}
                  labels={labels}
                  onDiagnostic={d => d.kind === 'error' && errors.push(d)}
                />
                <ToastViewport
                  aria-label="Notifications"
                  hotkey={false}
                />
              </ToastProvider>
            </div>
          </ThemeScope>
        ))}
      </A2uiMediaProvider>
    )
  )
  expect(errors).toEqual([])
  await settleMedia(host)
  await document.fonts.ready
  // One screenshot per frame, so a small change is never diluted across the other three. Check
  // every frame before failing, so one run reports and records all four.
  const failures: unknown[] = []
  for (const { mode, width } of frames) {
    const frame = host.querySelector<HTMLElement>(`[data-frame="${mode}-${width}"]`)!
    await expect
      .element(page.elementLocator(frame))
      .toMatchScreenshot(`${file(name)}--${mode}-${width}`)
      .catch((error: unknown) => failures.push(error))
  }
  if (failures.length > 0) throw failures[0]
})

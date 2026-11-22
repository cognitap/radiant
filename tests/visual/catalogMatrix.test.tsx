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
import { ThemeScope } from '../../src/index.js'
import { unseeded, visualCases, VISUAL_SURFACE_ID } from './catalogMatrix.js'
import './visual.css'

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)

const theme = themes.find(t => t.id === 'radiant')!
const modes = ['light', 'dark'] as const
const widths = [360, 720] as const
const labels = {
  modalClose: 'Close',
  notifications: 'Notifications',
  toastClose: 'Dismiss',
  revealPrevious: 'Previous',
  revealNext: 'Next',
  revealPosition: 'Step {index} of {count}'
}
const mounted: { host: HTMLElement; root: Root }[] = []

beforeAll(() => commands.emulatePreferences({ reducedMotion: 'reduce' }))
afterEach(async () => {
  for (const { host, root } of mounted.splice(0)) {
    await act(async () => root.unmount())
    host.remove()
  }
})

test('every catalog component has a seed', () => {
  expect(unseeded(), 'Add a seed in tests/visual/catalogMatrix.ts').toEqual([])
})

test.each(visualCases().map(c => [c.name, c] as const))('%s', async (name, { messages }) => {
  const errors: CatalogDiagnostic[] = []
  const host = document.createElement('div')
  host.style.cssText =
    'display:grid;grid-template-columns:repeat(4,max-content);align-items:stretch;width:max-content'
  document.body.append(host)
  const root = createRoot(host)
  mounted.push({ host, root })
  await act(async () =>
    root.render(
      <A2uiMediaProvider icons={lucideA2uiIcons}>
        {modes.flatMap(mode =>
          widths.map(width => (
            <ThemeScope
              key={`${mode}-${width}`}
              theme={theme}
              mode={mode}
            >
              <div
                style={{
                  width,
                  padding: 16,
                  boxSizing: 'border-box',
                  background: 'var(--rad-surface-canvas)',
                  color: 'var(--rad-color-foreground)'
                }}
              >
                <A2uiSurface
                  surfaceId={VISUAL_SURFACE_ID}
                  messages={messages as readonly A2uiMessage[]}
                  labels={labels}
                  onDiagnostic={d => d.kind === 'error' && errors.push(d)}
                />
              </div>
            </ThemeScope>
          ))
        )}
      </A2uiMediaProvider>
    )
  )
  expect(errors).toEqual([])
  await expect
    .element(page.elementLocator(host))
    .toMatchScreenshot(name.replaceAll('/', '--').replaceAll('=', '-').replaceAll(',', '_'))
})

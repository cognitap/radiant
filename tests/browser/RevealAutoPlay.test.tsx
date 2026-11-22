import { act, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import { defineTheme, Reveal, ThemeScope, type RevealProps } from '../../src/index.js'
import {
  A2uiSurface,
  radiantA2uiExtensionRegistry,
  type A2uiSurfaceLabels,
  type CatalogDiagnostic
} from '../../src/a2ui/index.js'
import { REVEAL_SURFACE_ID, revealFixtureMessages } from '../../src/a2ui/layoutIntentFixtures.js'
import { key, mount } from './familyHarness.js'

const part = (host: ParentNode, slot: string) =>
  host.querySelector<HTMLElement>(`[data-slot~="${slot}"]`)
const toggleOf = (host: ParentNode) => part(host, 'reveal-play') as HTMLButtonElement
const positionOf = (host: ParentNode) => part(host, 'reveal-position')!.textContent
const tick = (ms: number) => act(async () => vi.advanceTimersByTime(ms))
const frames = () =>
  new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
/** Emulates a motion preference and lets its change event settle inside act. */
const prefer = (reducedMotion: 'reduce' | 'no-preference') =>
  act(async () => {
    await commands.emulatePreferences({ reducedMotion })
    await frames()
  })

beforeEach(async () => {
  await commands.emulatePreferences({ reducedMotion: 'no-preference' })
  // The pointer can rest where an earlier test clicked; hovering holds playback.
  await userEvent.unhover(document.body)
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
})
afterEach(() => {
  vi.useRealTimers()
})

const reveal = (props: Record<string, unknown> = {}) => (
  <Reveal
    previousLabel="Back"
    nextLabel="Forward"
    positionLabel={(index, count) => `Step ${index + 1} of ${count}`}
    playback
    playLabel="Play steps"
    pauseLabel="Pause steps"
    interval={1000}
    items={[
      { value: 'name', children: <input aria-label="Name" /> },
      { value: 'city', children: <p>City step</p> },
      { value: 'done', children: <p>Done step</p> }
    ]}
    {...(props as Partial<RevealProps> & object)}
  />
)

/** Mounts, lets the motion check offer the toggle, and presses it by keyboard. */
async function playing(tree: ReactNode) {
  const mounted = await mount(tree)
  await act(frames)
  expect(toggleOf(mounted.host)).toBeTruthy()
  await act(async () => toggleOf(mounted.host).focus())
  await key('{Enter}')
  return mounted
}

/**
 * Runs `action` and returns the steps region's `aria-live` value at each moment a step was
 * shown, replayed from mutation records in the order the DOM changed.
 */
async function liveWhenShown(steps: HTMLElement, action: () => Promise<unknown>) {
  const records: MutationRecord[] = []
  const observer = new MutationObserver(batch => records.push(...batch))
  observer.observe(steps, {
    subtree: true,
    attributes: true,
    attributeOldValue: true,
    attributeFilter: ['aria-live', 'hidden']
  })
  await action()
  records.push(...observer.takeRecords())
  observer.disconnect()
  const liveChanges = records.filter(record => record.attributeName === 'aria-live')
  const valueAfter = (record: MutationRecord) => {
    const following = liveChanges[liveChanges.indexOf(record) + 1]
    return following ? following.oldValue : steps.getAttribute('aria-live')
  }
  let live = liveChanges[0]?.oldValue ?? steps.getAttribute('aria-live')
  const shown: (string | null)[] = []
  for (const record of records) {
    if (record.attributeName === 'aria-live') live = valueAfter(record)
    else if (!(record.target as HTMLElement).hidden) shown.push(live)
  }
  return shown
}

test('playback starts on request, pauses, resumes and stops at the last step', async () => {
  const changes: string[] = []
  const { host } = await mount(reveal({ onValueChange: (value: string) => changes.push(value) }))
  await act(frames)
  const toggle = toggleOf(host)
  const steps = part(host, 'reveal-steps')!
  // Nothing plays until the user asks.
  await tick(3000)
  expect(changes).toEqual([])
  expect(toggle).toHaveAccessibleName('Play steps')
  expect(toggle).toHaveAttribute('aria-controls', steps.id)
  expect(toggle).not.toHaveAttribute('aria-pressed')
  expect(steps).toHaveAttribute('aria-live', 'polite')

  await act(async () => toggle.focus())
  await key('{Enter}')
  expect(toggle).toHaveAccessibleName('Pause steps')
  expect(host.firstElementChild).toHaveAttribute('data-playing')
  expect(steps).toHaveAttribute('aria-live', 'off')
  expect(part(host, 'reveal-position')).toHaveAttribute('aria-live', 'off')
  await tick(999)
  expect(changes).toEqual([])
  // Timed steps are not announced one by one.
  expect(await liveWhenShown(steps, () => tick(1))).toEqual(['off'])
  expect(changes).toEqual(['city'])
  expect(positionOf(host)).toBe('Step 2 of 3')

  await key('{Enter}')
  expect(toggle).toHaveAccessibleName('Play steps')
  expect(steps).toHaveAttribute('aria-live', 'polite')
  await tick(3000)
  expect(changes).toEqual(['city'])

  await key('{Enter}')
  // The region is polite again before the last step shows, so that step is announced.
  expect(await liveWhenShown(steps, () => tick(1000))).toEqual(['polite'])
  expect(positionOf(host)).toBe('Step 3 of 3')
  expect(toggle).toHaveAccessibleName('Play steps')
  expect(host.firstElementChild).not.toHaveAttribute('data-playing')
  // Focus stays on the toggle rather than moving with the last step.
  expect(document.activeElement).toBe(toggle)
  await tick(3000)
  expect(changes).toEqual(['city', 'done'])

  // Play at the end starts over.
  await key('{Enter}')
  expect(positionOf(host)).toBe('Step 1 of 3')
  expect(toggle).toHaveAccessibleName('Pause steps')
  expect(changes).toEqual(['city', 'done', 'name'])
})

test('a mouse press of play starts playback with the pointer still on the toggle', async () => {
  const { host } = await mount(reveal())
  await act(frames)
  await act(async () => userEvent.click(toggleOf(host)))
  expect(toggleOf(host)).toHaveAccessibleName('Pause steps')
  await tick(1000)
  expect(positionOf(host)).toBe('Step 2 of 3')
})

test('steps can override the interval and loop wraps to the first step', async () => {
  const { host } = await playing(
    reveal({
      loop: true,
      defaultValue: 'city',
      items: [
        { value: 'name', children: <p>Name step</p> },
        { value: 'city', children: <p>City step</p>, interval: 3000 },
        { value: 'done', children: <p>Done step</p> }
      ]
    })
  )
  await tick(2000)
  expect(positionOf(host)).toBe('Step 2 of 3')
  await tick(1000)
  expect(positionOf(host)).toBe('Step 3 of 3')
  await tick(1000)
  expect(positionOf(host)).toBe('Step 1 of 3')
  expect(toggleOf(host)).toHaveAccessibleName('Pause steps')
})

test('next during playback stops it and is announced', async () => {
  const { host } = await playing(reveal())
  const steps = part(host, 'reveal-steps')!
  const next = part(host, 'reveal-next') as HTMLButtonElement
  await act(async () => next.focus())
  expect(await liveWhenShown(steps, () => key('{Enter}'))).toEqual(['polite'])
  expect(positionOf(host)).toBe('Step 2 of 3')
  expect(toggleOf(host)).toHaveAccessibleName('Play steps')
  expect(document.activeElement).toBe(next)
  // Focus still follows the end of the steps.
  await key('{Enter}')
  expect(positionOf(host)).toBe('Step 3 of 3')
  expect(document.activeElement).toBe(part(host, 'reveal-previous'))
})

test('playback waits while focus or the pointer is inside and while the page is hidden', async () => {
  const { host } = await playing(
    <>
      {reveal()}
      <p data-test="outside">Outside</p>
    </>
  )
  // Focus on the toggle itself keeps playing.
  await tick(1000)
  expect(positionOf(host)).toBe('Step 2 of 3')

  await act(async () => (part(host, 'reveal-previous') as HTMLButtonElement).focus())
  await tick(3000)
  expect(positionOf(host)).toBe('Step 2 of 3')
  expect(host.firstElementChild).not.toHaveAttribute('data-playing')
  // Paused, not stopped: the toggle still offers pause.
  expect(toggleOf(host)).toHaveAccessibleName('Pause steps')
  await act(async () => (document.activeElement as HTMLElement).blur())

  const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
  await act(async () => document.dispatchEvent(new Event('visibilitychange')))
  await tick(3000)
  expect(positionOf(host)).toBe('Step 2 of 3')
  visibility.mockRestore()
  await act(async () => document.dispatchEvent(new Event('visibilitychange')))

  await act(async () => userEvent.hover(part(host, 'reveal-steps')!))
  await tick(3000)
  expect(positionOf(host)).toBe('Step 2 of 3')
  await act(async () => userEvent.hover(host.querySelector('[data-test="outside"]')!))
  await tick(1000)
  expect(positionOf(host)).toBe('Step 3 of 3')
})

test('an outside value change while playing continues from the new step', async () => {
  const changes: string[] = []
  const onValueChange = (value: string) => changes.push(value)
  const { host, render } = await playing(reveal({ value: 'name', onValueChange }))
  await tick(500)
  await render(reveal({ value: 'city', onValueChange }))
  expect(positionOf(host)).toBe('Step 2 of 3')
  expect(toggleOf(host)).toHaveAccessibleName('Pause steps')
  // The interval starts again for the new step.
  await tick(999)
  expect(changes).toEqual([])
  await tick(1)
  expect(changes).toEqual(['done'])
})

test('reduced motion and theme motion off never offer or run playback', async () => {
  await prefer('reduce')
  const changes: string[] = []
  const onValueChange = (value: string) => changes.push(value)
  const { host, render } = await mount(reveal({ onValueChange }))
  await act(frames)
  expect(toggleOf(host)).toBeNull()
  // The position stays in the same wrapper, so it does not remount when the toggle appears.
  const position = part(host, 'reveal-position')
  expect(position?.parentElement).toHaveAttribute('data-slot', 'reveal-playback')
  await tick(3000)
  expect(changes).toEqual([])

  await prefer('no-preference')
  expect(part(host, 'reveal-position')).toBe(position)
  await act(async () => toggleOf(host).focus())
  await key('{Enter}')
  // Turning reduced motion on mid-play stops playback, and focus moves off the toggle.
  await prefer('reduce')
  expect(toggleOf(host)).toBeNull()
  expect(document.activeElement).toBe(part(host, 'reveal-next'))
  await tick(3000)
  expect(changes).toEqual([])
  await prefer('no-preference')

  const still = defineTheme({ id: 'still', name: 'Still', motion: { mode: 'off' } })
  await render(<ThemeScope theme={still}>{reveal({ onValueChange })}</ThemeScope>)
  await act(frames)
  expect(toggleOf(host)).toBeNull()
  await tick(3000)
  expect(changes).toEqual([])
})

test('a toggle that leaves with focus when one step remains releases focus', async () => {
  const { host, render } = await playing(reveal())
  expect(document.activeElement).toBe(toggleOf(host))
  await render(reveal({ items: [{ value: 'name', children: <p>Only step</p> }] }))
  expect(toggleOf(host)).toBeNull()
  // Previous and next are both disabled with one step, so nothing inside can take focus.
  expect(host.contains(document.activeElement)).toBe(false)
  await tick(3000)
  expect(positionOf(host)).toBe('Step 1 of 1')
})

test('a controlled owner that declines a step stops playback', async () => {
  const changes: string[] = []
  const { host } = await playing(
    reveal({ value: 'name', onValueChange: (value: string) => changes.push(value) })
  )
  await tick(1000)
  expect(changes).toEqual(['city'])
  expect(positionOf(host)).toBe('Step 1 of 3')
  expect(toggleOf(host)).toHaveAccessibleName('Play steps')
  await tick(3000)
  expect(changes).toEqual(['city'])
})

test('playback off renders as before and playback requires names and a usable interval', () => {
  const render = (node: ReactNode) => () => renderToStaticMarkup(node)
  const plain = renderToStaticMarkup(
    reveal({ playback: false, playLabel: undefined, pauseLabel: undefined })
  )
  expect(plain).not.toMatch(/reveal-play/)
  // Server markup offers no toggle before the browser reports its motion preference.
  expect(renderToStaticMarkup(reveal())).not.toMatch(/reveal-play"/)
  expect(render(reveal({ pauseLabel: ' ' }))).toThrow(/nonempty playLabel and pauseLabel/)
  expect(render(reveal({ interval: 500 }))).toThrow(/from 1000 to 60000ms/)
  expect(render(reveal({ interval: 60001 }))).toThrow(/from 1000 to 60000ms/)
})

const playbackMessages = () => {
  const messages = structuredClone(revealFixtureMessages) as unknown as {
    createSurface?: { components: Record<string, unknown>[] }
  }[]
  for (const message of messages) {
    const root = message.createSurface?.components.find(component => component.id === 'root')
    if (root) Object.assign(root, { playback: true, interval: 1000 })
  }
  return messages as never
}
const a2uiLabels: A2uiSurfaceLabels = {
  revealPrevious: 'Back',
  revealNext: 'Forward',
  revealPosition: 'Step {index} of {count}'
}

test('A2UI Reveal plays with host play and pause names', async () => {
  const diagnostics: CatalogDiagnostic[] = []
  const { host } = await playing(
    <A2uiSurface
      surfaceId={REVEAL_SURFACE_ID}
      messages={playbackMessages()}
      registry={radiantA2uiExtensionRegistry}
      labels={{ ...a2uiLabels, revealPlay: 'Play recipe', revealPause: 'Pause recipe' }}
      onDiagnostic={diagnostic => diagnostics.push(diagnostic)}
    />
  )
  expect(toggleOf(host)).toHaveAccessibleName('Pause recipe')
  await tick(1000)
  expect(positionOf(host)).toBe('Step 2 of 3')
  expect(diagnostics).not.toContainEqual(expect.objectContaining({ prop: 'playback' }))
})

test('A2UI Reveal without play and pause names offers no playback and reports it', async () => {
  const diagnostics: CatalogDiagnostic[] = []
  const { host } = await mount(
    <A2uiSurface
      surfaceId={REVEAL_SURFACE_ID}
      messages={playbackMessages()}
      registry={radiantA2uiExtensionRegistry}
      labels={{ ...a2uiLabels, revealPlay: 'Play recipe' }}
      onDiagnostic={diagnostic => diagnostics.push(diagnostic)}
    />
  )
  await act(frames)
  expect(part(host, 'reveal-controls')).toBeTruthy()
  expect(toggleOf(host)).toBeNull()
  expect(diagnostics).toContainEqual(
    expect.objectContaining({
      kind: 'defaulted',
      component: 'Reveal',
      prop: 'playback',
      received: true,
      used: false
    })
  )
})

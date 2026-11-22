import { flushSync } from 'react-dom'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import type { ReactNode } from 'react'
import { afterEach, expect, test, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { AudioPlayer, AudioPlayerGroup, LocaleProvider } from '../../src/index.js'
import { toneDataUrl } from '../../src/a2ui/mediaFixtures.js'
import '../../.storybook/styles.css'

// Media events update the player whenever the browser fires them, outside any act() scope, so
// this file renders without act and waits for the DOM instead.
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', false)

const mounted: { host: HTMLDivElement; root: Root }[] = []

async function mount(tree: ReactNode, hydrate = false) {
  const host = document.createElement('div')
  document.body.append(host)
  const errors: unknown[] = []
  let root: Root
  if (hydrate) {
    host.innerHTML = renderToString(tree)
    root = hydrateRoot(host, tree, { onRecoverableError: error => errors.push(error) })
    await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve)))
  } else {
    root = createRoot(host)
    flushSync(() => root.render(tree))
  }
  mounted.push({ host, root })
  expect(errors).toEqual([])
  return { host, render: (next: ReactNode) => flushSync(() => root.render(next)) }
}

afterEach(() => {
  vi.restoreAllMocks()
  for (const { host, root } of mounted.splice(0)) {
    root.unmount()
    host.remove()
  }
})

const clip = toneDataUrl(10)
const labels = { playLabel: 'Play', pauseLabel: 'Pause', seekLabel: 'Seek' } as const

const part = (host: ParentNode, slot: string) =>
  host.querySelector<HTMLElement>(`[data-slot~="${slot}"]`)!
const media = (host: ParentNode) => part(host, 'audio-player-media') as HTMLAudioElement
const toggleOf = (host: ParentNode) => part(host, 'audio-player-toggle') as HTMLButtonElement
const scrubberOf = (host: ParentNode) => part(host, 'audio-player-scrubber') as HTMLInputElement
const timeText = (host: ParentNode) => part(host, 'audio-player-time').textContent
const stateOf = (host: HTMLElement) =>
  (host.matches('[data-slot~="audio-player"]') ? host : part(host, 'audio-player')).dataset.state
const loaded = (host: ParentNode, total = '0:10') =>
  expect.poll(() => timeText(host)).toBe(`0:00 / ${total}`)
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** Moves the native range value as a pointer drag does, firing input. */
function dragTo(input: HTMLInputElement, value: number) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(
    input,
    String(value)
  )
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

test('plays and pauses by click, switching the toggle name and state', async () => {
  const onPlayingChange = vi.fn()
  const { host } = await mount(
    <AudioPlayer
      {...labels}
      muted
      aria-label="Voice note"
      src={clip}
      onPlayingChange={onPlayingChange}
    />
  )
  const root = part(host, 'audio-player')
  expect(root.getAttribute('role')).toBe('group')
  expect(root.getAttribute('aria-label')).toBe('Voice note')
  await loaded(host)
  await userEvent.click(page.getByRole('button', { name: 'Play' }))
  await expect.element(page.getByRole('button', { name: 'Pause' })).toBeVisible()
  expect(stateOf(host)).toBe('playing')
  expect(onPlayingChange).toHaveBeenLastCalledWith(true)
  await expect.poll(() => media(host).currentTime).toBeGreaterThan(0)
  await userEvent.click(page.getByRole('button', { name: 'Pause' }))
  await expect.element(page.getByRole('button', { name: 'Play' })).toBeVisible()
  expect(stateOf(host)).toBe('paused')
  expect(media(host).paused).toBe(true)
  expect(onPlayingChange).toHaveBeenLastCalledWith(false)
})

test('plays and pauses from the keyboard', async () => {
  const { host } = await mount(
    <AudioPlayer
      {...labels}
      muted
      src={clip}
    />
  )
  await loaded(host)
  toggleOf(host).focus()
  await userEvent.keyboard('{Enter}')
  await expect.poll(() => toggleOf(host).getAttribute('aria-label')).toBe('Pause')
  expect(media(host).paused).toBe(false)
  await userEvent.keyboard(' ')
  await expect.poll(() => toggleOf(host).getAttribute('aria-label')).toBe('Play')
  expect(media(host).paused).toBe(true)
})

for (const dir of ['ltr', 'rtl'] as const) {
  test(`scrubs by keyboard in ${dir} and shows the time`, async () => {
    const { host } = await mount(
      <div dir={dir}>
        <AudioPlayer
          {...labels}
          muted
          src={clip}
        />
      </div>
    )
    await loaded(host)
    const scrubber = scrubberOf(host)
    expect(scrubber.disabled).toBe(false)
    expect(scrubber.max).toBe('10')
    expect(scrubber.getAttribute('aria-valuetext')).toBe('0 seconds')
    expect(scrubber.getAttribute('aria-describedby')).toBe(part(host, 'audio-player-time').id)
    scrubber.focus()
    await userEvent.keyboard('{PageUp}')
    await expect.poll(() => media(host).currentTime).toBeCloseTo(1, 1)
    await userEvent.keyboard(dir === 'rtl' ? '{ArrowLeft}' : '{ArrowRight}')
    await expect.poll(() => media(host).currentTime).toBeCloseTo(1.1, 1)
    await userEvent.keyboard('{Home}')
    await expect.poll(() => media(host).currentTime).toBe(0)
    await userEvent.keyboard('{PageUp}{PageUp}{PageUp}{PageUp}{PageUp}{PageUp}{PageUp}')
    await expect.poll(() => timeText(host)).toBe('0:07 / 0:10')
    expect(scrubber.getAttribute('aria-valuetext')).toBe('7 seconds')
  })
}

test('a focused scrubber keeps its value while playing and steps from the playing time', async () => {
  const { host } = await mount(
    <AudioPlayer
      {...labels}
      muted
      src={clip}
    />
  )
  await loaded(host)
  const scrubber = scrubberOf(host)
  await userEvent.click(toggleOf(host))
  scrubber.focus()
  await expect.poll(() => media(host).currentTime, { timeout: 3000 }).toBeGreaterThan(0.6)
  await expect.poll(() => timeText(host)).not.toBe('0:00 / 0:10')
  expect(scrubber.valueAsNumber).toBe(0)
  expect(scrubber.getAttribute('aria-valuetext')).toBe('0 seconds')
  const before = media(host).currentTime
  await userEvent.keyboard('{PageUp}')
  await expect.poll(() => scrubber.valueAsNumber).toBeGreaterThan(before + 0.9)
  expect(media(host).currentTime).toBeGreaterThan(before + 0.9)
  const held = scrubber.valueAsNumber
  await wait(600)
  expect(scrubber.valueAsNumber).toBe(held)
  media(host).pause()
  await expect.poll(() => scrubber.valueAsNumber).toBe(media(host).currentTime)
  scrubber.blur()
})

test('a pointer drag shows its value and seeks on release while the clip plays', async () => {
  const { host } = await mount(
    <AudioPlayer
      {...labels}
      muted
      src={clip}
    />
  )
  await loaded(host)
  const scrubber = scrubberOf(host)
  await userEvent.click(toggleOf(host))
  await expect.poll(() => stateOf(host)).toBe('playing')
  scrubber.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }))
  dragTo(scrubber, 6)
  await expect.poll(() => timeText(host)).toBe('0:06 / 0:10')
  await wait(600)
  expect(scrubber.valueAsNumber).toBe(6)
  expect(timeText(host)).toBe('0:06 / 0:10')
  expect(media(host).currentTime).toBeLessThan(2)
  document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
  await expect.poll(() => media(host).currentTime).toBeGreaterThanOrEqual(6)
  expect(stateOf(host)).toBe('playing')
})

test('formats the time in the locale digits', async () => {
  const { host } = await mount(
    <LocaleProvider locale="ar-EG">
      <AudioPlayer
        {...labels}
        src={clip}
      />
    </LocaleProvider>
  )
  await expect.poll(() => timeText(host)).toBe('٠:٠٠ / ٠:١٠')
})

test('a compact player is one named play button and requires a name', async () => {
  const { host } = await mount(
    <AudioPlayer
      compact
      playLabel="Play"
      pauseLabel="Pause"
      aria-label="Preview"
      muted
      src={clip}
    />
  )
  const root = part(host, 'audio-player')
  expect(root.hasAttribute('data-compact')).toBe(true)
  expect(host.querySelectorAll('button')).toHaveLength(1)
  expect(host.querySelector('input')).toBeNull()
  expect(host.querySelector('[data-slot="audio-player-time"]')).toBeNull()
  await expect.element(page.getByRole('group', { name: 'Preview' })).toBeVisible()
  await userEvent.click(toggleOf(host))
  await expect.element(page.getByRole('button', { name: 'Pause' })).toBeVisible()

  const unnamed = (
    // @ts-expect-error A compact player needs aria-label or aria-labelledby.
    <AudioPlayer
      compact
      playLabel="Play"
      pauseLabel="Pause"
      src={clip}
    />
  )
  expect(() => renderToString(unnamed)).toThrow(TypeError)
  expect(() =>
    renderToString(
      <AudioPlayer
        playLabel=" "
        pauseLabel="Pause"
        seekLabel="Seek"
      />
    )
  ).toThrow(/playLabel and pauseLabel/)
  expect(() =>
    renderToString(
      // @ts-expect-error The full player needs a seekLabel.
      <AudioPlayer
        playLabel="Play"
        pauseLabel="Pause"
      />
    )
  ).toThrow(/seekLabel/)
})

test('starting one player in a group pauses the other; players outside play on', async () => {
  const { host } = await mount(
    <>
      <AudioPlayerGroup>
        <AudioPlayer
          {...labels}
          aria-label="First"
          muted
          src={clip}
        />
        <AudioPlayer
          {...labels}
          aria-label="Second"
          muted
          src={clip}
        />
      </AudioPlayerGroup>
      <AudioPlayer
        {...labels}
        aria-label="Outside"
        muted
        src={clip}
      />
    </>
  )
  const [first, second, outside] = Array.from(
    host.querySelectorAll<HTMLElement>('[data-slot~="audio-player"]')
  )
  const play = (root: HTMLElement) => userEvent.click(toggleOf(root))
  await play(outside!)
  await play(first!)
  await expect.poll(() => stateOf(first!)).toBe('playing')
  await play(second!)
  await expect.poll(() => stateOf(second!)).toBe('playing')
  await expect.poll(() => stateOf(first!)).toBe('paused')
  expect(media(first!).paused).toBe(true)
  expect(stateOf(outside!)).toBe('playing')
})

test('unmounting a playing grouped player releases its claim and reports it stopped', async () => {
  const onPlayingChange = vi.fn()
  const player = (name: string, extra?: object) => (
    <AudioPlayer
      key={name}
      {...labels}
      {...extra}
      aria-label={name}
      muted
      src={clip}
    />
  )
  const { host, render } = await mount(
    <AudioPlayerGroup>
      {player('First', { onPlayingChange })}
      {player('Second')}
    </AudioPlayerGroup>
  )
  const firstAudio = media(host)
  await userEvent.click(toggleOf(host))
  await expect.poll(() => onPlayingChange.mock.lastCall).toEqual([true])
  render(<AudioPlayerGroup>{player('Second')}</AudioPlayerGroup>)
  expect(onPlayingChange).toHaveBeenLastCalledWith(false)
  const pause = vi.spyOn(firstAudio, 'pause')
  await userEvent.click(toggleOf(host))
  await expect.poll(() => stateOf(host)).toBe('playing')
  expect(pause).not.toHaveBeenCalled()
})

test('an ended clip returns to paused at its end and plays again from the start', async () => {
  const onPlayingChange = vi.fn()
  const { host } = await mount(
    <AudioPlayer
      {...labels}
      muted
      src={toneDataUrl(0.6)}
      onPlayingChange={onPlayingChange}
    />
  )
  await loaded(host, '0:00')
  await userEvent.click(toggleOf(host))
  await expect.poll(() => media(host).ended, { timeout: 3000 }).toBe(true)
  await expect.poll(() => stateOf(host)).toBe('paused')
  expect(toggleOf(host).getAttribute('aria-label')).toBe('Play')
  expect(onPlayingChange).toHaveBeenLastCalledWith(false)
  expect(scrubberOf(host).valueAsNumber).toBeCloseTo(0.6, 1)
  await userEvent.click(toggleOf(host))
  await expect.poll(() => stateOf(host)).toBe('playing')
  expect(media(host).currentTime).toBeLessThan(0.5)
})

test('a looping clip keeps playing past its end', async () => {
  const { host } = await mount(
    <AudioPlayer
      {...labels}
      loop
      muted
      src={toneDataUrl(0.4)}
    />
  )
  await expect.poll(() => media(host).readyState).toBeGreaterThan(0)
  await userEvent.click(toggleOf(host))
  await wait(1000)
  expect(stateOf(host)).toBe('playing')
  expect(media(host).ended).toBe(false)
  await userEvent.click(toggleOf(host))
})

test('a new src mid-play resets the length, time and state', async () => {
  const onPlayingChange = vi.fn()
  const tree = (src: string) => (
    <AudioPlayer
      {...labels}
      muted
      src={src}
      onPlayingChange={onPlayingChange}
    />
  )
  const { host, render } = await mount(tree(clip))
  await loaded(host)
  await userEvent.click(toggleOf(host))
  await expect.poll(() => media(host).currentTime).toBeGreaterThan(0.3)
  render(tree(toneDataUrl(3)))
  await loaded(host, '0:03')
  expect(stateOf(host)).toBe('paused')
  expect(toggleOf(host).getAttribute('aria-label')).toBe('Play')
  expect(scrubberOf(host).valueAsNumber).toBe(0)
  expect(onPlayingChange).toHaveBeenLastCalledWith(false)
})

test('a refused play() leaves the player paused', async () => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockRejectedValue(
    new DOMException('Playback needs a gesture.', 'NotAllowedError')
  )
  const { host } = await mount(
    <AudioPlayer
      {...labels}
      src={clip}
    />
  )
  await loaded(host)
  await userEvent.click(toggleOf(host))
  await wait(100)
  expect(stateOf(host)).toBe('paused')
  expect(toggleOf(host).getAttribute('aria-label')).toBe('Play')
})

test('a media error disables the controls and announces the error text', async () => {
  const { host } = await mount(
    <AudioPlayer
      {...labels}
      src="data:audio/wav;base64,AAAA"
      errorText="This clip cannot be played."
    />
  )
  const root = part(host, 'audio-player')
  await expect.poll(() => stateOf(host)).toBe('error')
  const error = part(host, 'audio-player-error')
  expect(error.tagName).toBe('OUTPUT')
  expect(error.textContent).toBe('This clip cannot be played.')
  expect(root.getAttribute('aria-describedby')).toBe(error.id)
  expect(root.hasAttribute('aria-busy')).toBe(false)
  expect(toggleOf(host).disabled).toBe(true)
  expect(scrubberOf(host).disabled).toBe(true)
  expect(timeText(host)).toBe('0:00 / --:--')
})

test('fails when every source child fails, and recovers on a new key', async () => {
  const tree = (key: string, type: string) => (
    <AudioPlayer
      key={key}
      {...labels}
      errorText="No playable source."
    >
      <source
        src="data:audio/wav;base64,AAAA"
        type="audio/wav"
      />
      <source
        src={type === 'good' ? clip : 'data:audio/wav;base64,BBBB'}
        type="audio/wav"
      />
    </AudioPlayer>
  )
  const { host, render } = await mount(tree('a', 'bad'))
  await expect.poll(() => stateOf(host)).toBe('error')
  expect(part(host, 'audio-player-error').textContent).toBe('No playable source.')
  expect(toggleOf(host).disabled).toBe(true)
  render(tree('b', 'good'))
  await loaded(host)
  expect(stateOf(host)).toBe('paused')
  expect(toggleOf(host).disabled).toBe(false)
})

test('without a source the toggle is disabled', async () => {
  const { host } = await mount(<AudioPlayer {...labels} />)
  await wait(100)
  expect(toggleOf(host).disabled).toBe(true)
  expect(stateOf(host)).toBe('paused')
  expect(scrubberOf(host).disabled).toBe(true)
})

test('preload none leaves the length unknown, and the player idle, until playback', async () => {
  const { host } = await mount(
    <AudioPlayer
      {...labels}
      preload="none"
      muted
      src={clip}
    />
  )
  await wait(100)
  expect(media(host).preload).toBe('none')
  expect(part(host, 'audio-player').hasAttribute('aria-busy')).toBe(false)
  expect(scrubberOf(host).disabled).toBe(true)
  expect(timeText(host)).toBe('0:00 / --:--')
  await userEvent.click(toggleOf(host))
  await expect.poll(() => scrubberOf(host).disabled).toBe(false)
  await expect.poll(() => timeText(host)).toMatch(/ \/ 0:10$/)
  await userEvent.click(toggleOf(host))
})

test('server markup hydrates, then reads the loaded media', async () => {
  const tree = (
    <AudioPlayer
      {...labels}
      aria-label="Voice note"
      data-slot="note"
      src={clip}
    />
  )
  const html = renderToString(tree)
  expect(html).toMatch(/^<div aria-label="Voice note" data-slot="audio-player note" role="group"/)
  expect(html).toContain('data-state="paused"')
  expect(html).toMatch(/<bdi>0:00<\/bdi> \/ <bdi>--:--<\/bdi>/)
  const { host } = await mount(tree, true)
  await loaded(host)
  expect(stateOf(host)).toBe('paused')
})

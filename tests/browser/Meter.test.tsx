import { act, createRef, StrictMode, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import { Button, Meter, ThemeScope, defineTheme } from '../../src/index.js'
import {
  ManageRecordingStorage,
  ChooseRecorder,
  ChooseStudyRoom
} from '../../.storybook/examples/MeterExamples.js'
import '../../.storybook/styles.css'
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const mounted: { root: Root; host: HTMLDivElement }[] = []
async function mount(tree: ReactNode, hydrate = false) {
  const host = document.createElement('div')
  document.body.append(host)
  if (hydrate) host.innerHTML = renderToString(tree)
  let root!: Root
  const errors: unknown[] = []
  await act(async () => {
    root = hydrate
      ? hydrateRoot(host, tree, { onRecoverableError: error => errors.push(error) })
      : createRoot(host)
    if (!hydrate) root.render(tree)
  })
  mounted.push({ root, host })
  expect(errors).toEqual([])
  return { host, render: (tree: ReactNode) => act(async () => root.render(tree)) }
}
afterEach(async () => {
  for (const { root, host } of mounted.splice(0)) {
    await act(async () => root.unmount())
    host.remove()
  }
})
const click = (node: Element) =>
  act(async () => {
    await userEvent.click(node)
  })
const choose = (node: HTMLSelectElement, value: string) =>
  act(async () => {
    await userEvent.selectOptions(node, value)
  })
test('native gauge hydrates with its label, exact ref, measured range and units', async () => {
  const ref = createRef<HTMLMeterElement>()
  const { host } = await mount(
    <StrictMode>
      <label htmlFor="storage">Storage used</label>
      <Meter
        ref={ref}
        id="storage"
        value={7.2}
        max={10}
        low={6}
        high={8.5}
        optimum={0}
        aria-valuetext="7.2 GB of 10 GB used"
      />
    </StrictMode>,
    true
  )
  expect(ref.current).toBeInstanceOf(HTMLMeterElement)
  expect(ref.current).toBe(host.querySelector('meter'))
  expect(ref.current?.labels?.[0]?.textContent).toBe('Storage used')
  expect(ref.current?.value).toBe(7.2)
  expect(ref.current?.max).toBe(10)
  expect(ref.current?.low).toBe(6)
  expect(ref.current?.high).toBe(8.5)
  expect(ref.current?.optimum).toBe(0)
  expect(ref.current?.getAttribute('aria-valuetext')).toBe('7.2 GB of 10 GB used')
  expect(host.querySelectorAll('progress,input,[role],[aria-live],[tabindex]')).toHaveLength(0)
})
test('prop updates synchronize native metrics without input or change events', async () => {
  const input = vi.fn(),
    change = vi.fn(),
    tree = (value: number) => (
      <Meter
        aria-label="Temperature"
        min={-20}
        max={40}
        low={18}
        high={24}
        optimum={21}
        value={value}
        onInput={input}
        onChange={change}
      />
    )
  const { host, render } = await mount(tree(-5)),
    meter = host.querySelector('meter')!
  expect(meter.min).toBe(-20)
  expect(meter.dataset.tone).toBe('warning')
  await render(tree(21))
  expect(meter.value).toBe(21)
  expect(meter.dataset.tone).toBe('accent')
  expect(meter.getAttribute('aria-valuetext')).toBe('21 of 40')
  expect(input).not.toHaveBeenCalled()
  expect(change).not.toHaveBeenCalled()
})
test('the passive native gauge adds neither a Tab stop nor a form value', async () => {
  const { host } = await mount(
    <form>
      <Button>Before</Button>
      <Meter
        aria-label="Capacity"
        value={0.5}
      />
      <Button>After</Button>
    </form>
  )
  const buttons = host.querySelectorAll('button')
  await click(buttons[0]!)
  await act(async () => {
    await userEvent.keyboard('{Tab}')
  })
  expect(document.activeElement).toBe(buttons[1])
  expect(Array.from(new FormData(host.querySelector('form')!).entries())).toEqual([])
})
test('meter styles target its native host and remain isolated from Progress overrides', async () => {
  const { host } = await mount(
    <ThemeScope
      theme={defineTheme({
        id: 'gauge',
        name: 'Gauge',
        components: {
          progress: { height: '90px' },
          meter: {
            height: '16px',
            radius: '3px',
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: 'black',
            trackColor: 'white',
            indicatorColor: 'green',
            warningColor: 'orange',
            dangerColor: 'red'
          }
        }
      })}
    >
      <div style={{ width: '240px' }}>
        <Meter
          aria-label="Capacity"
          value={0.5}
          dir="rtl"
          className="rounded-none"
          style={{ height: '12px' }}
        />
      </div>
    </ThemeScope>
  )
  const meter = host.querySelector('meter')!,
    style = getComputedStyle(meter)
  expect(meter.getBoundingClientRect().width).toBe(240)
  expect(meter.getBoundingClientRect().height).toBe(12)
  expect(style.borderRadius).toBe('0px')
  expect(style.direction).toBe('rtl')
  expect(style.getPropertyValue('--_rad-meter-fill').trim()).toBe('green')
  expect(style.getPropertyValue('--rad-meter-warning-color').trim()).toBe('orange')
})
test('archiving and allocating actual files updates storage totals and prevents exceeding capacity', async () => {
  const { host } = await mount(<ManageRecordingStorage />),
    meter = host.querySelector('meter')!,
    buttons = host.querySelectorAll('button')
  expect(meter.value).toBe(7.2)
  expect(meter.dataset.tone).toBe('warning')
  await click(buttons[0]!)
  await click(buttons[0]!)
  expect(meter.value).toBe(8.8)
  expect(meter.dataset.tone).toBe('danger')
  await click(buttons[0]!)
  expect(meter.value).toBe(9.6)
  expect(buttons[0]?.disabled).toBe(true)
  await click(buttons[1]!)
  expect(meter.value).toBe(5.4)
  expect(meter.dataset.tone).toBe('accent')
  expect(buttons[1]?.disabled).toBe(true)
  expect(host.querySelector('output')?.textContent).toBe('Archived interview recordings.')
  expect(host.textContent).not.toContain('Interview recordings:')
})
test('recorder and room choices update meaningful measurements and record details', async () => {
  const recorder = await mount(<ChooseRecorder />),
    battery = recorder.host.querySelector('meter')!
  await choose(recorder.host.querySelector('select')!, 'spare')
  expect(battery.value).toBe(35)
  expect(battery.dataset.tone).toBe('warning')
  await choose(recorder.host.querySelector('select')!, 'travel')
  expect(battery.value).toBe(10)
  expect(battery.dataset.tone).toBe('danger')
  expect(recorder.host.textContent).toContain('20 minutes estimated recording time')
  const room = await mount(<ChooseStudyRoom />),
    temperature = room.host.querySelector('meter')!
  await choose(room.host.querySelector('select')!, 'studio')
  expect(temperature.value).toBe(28)
  expect(temperature.dataset.tone).toBe('warning')
  expect(temperature.getAttribute('aria-valuetext')).toContain(
    'outside the configured comfort band'
  )
  expect(room.host.textContent).toContain('4 seats')
})
test('forced colors retain the gauge boundary and measured value under reduced motion', async () => {
  await commands.emulatePreferences({ forcedColors: 'active', reducedMotion: 'reduce' })
  try {
    const { host } = await mount(
        <Meter
          aria-label="Capacity"
          value={0.75}
        />
      ),
      meter = host.querySelector('meter')!,
      style = getComputedStyle(meter)
    expect(style.borderTopColor).not.toBe(style.backgroundColor)
    expect(meter.value).toBe(0.75)
    expect(style.transitionDuration).toBe('0s')
  } finally {
    await commands.emulatePreferences({ forcedColors: 'none', reducedMotion: 'no-preference' })
  }
})

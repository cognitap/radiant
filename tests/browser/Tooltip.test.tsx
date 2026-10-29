import { act, createRef, StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { expect, test, vi } from 'vitest'
import { userEvent, commands } from 'vitest/browser'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipPortal,
  Popover,
  PopoverTrigger,
  PopoverContent,
  ThemeScope,
  defineTheme,
  type TooltipProps
} from '../../src/index.js'
import { MotionProvider } from '../../src/motion/react.js'
import { mount, key, click, shown, pause } from './familyHarness.js'
function Fixture(props: TooltipProps) {
  return (
    <Tooltip {...props}>
      <TooltipTrigger aria-describedby="help help">Export</TooltipTrigger>
      <TooltipPortal>
        <TooltipContent>Download a CSV file.</TooltipContent>
      </TooltipPortal>
    </Tooltip>
  )
}
function parts(host: HTMLElement) {
  return {
    trigger: host.querySelector('button')!,
    panel: host.querySelector<HTMLElement>('[role=tooltip]')!
  }
}
test('SSR/hydration connect a supplementary description; focus and Escape preserve the trigger', async () => {
  const tree = (
    <StrictMode>
      <Fixture />
      <input
        id="help"
        aria-label="Outside"
      />
    </StrictMode>
  )
  expect(renderToString(tree)).toContain('role="tooltip"')
  const { host } = await mount(tree, true)
  const p = parts(host)
  expect(p.trigger.getAttribute('aria-describedby')!.split(' ')).toEqual([p.panel.id, 'help'])
  expect(p.trigger.hasAttribute('aria-expanded')).toBe(false)
  await act(async () => p.trigger.focus())
  expect(shown(p.panel)).toBe(true)
  await key('{Escape}')
  expect(shown(p.panel)).toBe(false)
  expect(document.activeElement).toBe(p.trigger)
  await act(async () => userEvent.hover(p.trigger))
  await pause(40)
  expect(shown(p.panel)).toBe(false)
  await act(async () => {
    host.querySelector('input')!.focus()
    p.trigger.focus()
  })
  expect(shown(p.panel)).toBe(true)
})
test('delayed hover remains hoverable across the gap and closes after leaving both targets', async () => {
  const { host } = await mount(
    <>
      <Fixture
        openDelay={40}
        closeDelay={15}
      />
      <input aria-label="Outside" />
    </>
  )
  const p = parts(host)
  await act(async () => {
    p.trigger.dispatchEvent(
      new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse' })
    )
  })
  expect(shown(p.panel)).toBe(false)
  await pause(70)
  expect(shown(p.panel)).toBe(true)
  await act(async () => userEvent.hover(p.panel))
  await pause(40)
  expect(shown(p.panel)).toBe(true)
  await act(async () => userEvent.hover(host.querySelector('input')!))
  await pause(40)
  expect(shown(p.panel)).toBe(false)
})
test('pending hover timers are canceled on unmount', async () => {
  const changes = vi.fn()
  const { host, render } = await mount(
    <Fixture
      openDelay={50}
      onOpenChange={changes}
    />
  )
  await act(async () => userEvent.hover(parts(host).trigger))
  await render(null)
  await pause(80)
  expect(changes).not.toHaveBeenCalled()
})
test('touch focus does not open the description or consume activation', async () => {
  const action = vi.fn()
  const { host } = await mount(
    <Tooltip>
      <TooltipTrigger onClick={action}>Export</TooltipTrigger>
      <TooltipContent>CSV format</TooltipContent>
    </Tooltip>
  )
  const p = parts(host)
  await act(async () => {
    p.trigger.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' })
    )
    p.trigger.focus()
  })
  expect(shown(p.panel)).toBe(false)
  await key('{Enter}')
  expect(action).toHaveBeenCalledOnce()
  expect(shown(p.panel)).toBe(false)
})
test('controlled owners may refuse dismissal and prop synchronization does not notify', async () => {
  const changes = vi.fn()
  const { host, render } = await mount(
    <Fixture
      open
      onOpenChange={changes}
    />
  )
  await key('{Escape}')
  expect(changes).toHaveBeenCalledExactlyOnceWith(false)
  expect(shown(parts(host).panel)).toBe(true)
  changes.mockClear()
  await render(
    <Fixture
      open={false}
      onOpenChange={changes}
    />
  )
  expect(changes).not.toHaveBeenCalled()
  expect(shown(parts(host).panel)).toBe(false)
})
test('Tooltip receives Escape before its containing Popover', async () => {
  const { host } = await mount(
    <Popover defaultOpen>
      <PopoverTrigger>Outer</PopoverTrigger>
      <PopoverContent>
        <Fixture />
      </PopoverContent>
    </Popover>
  )
  const trigger = host.querySelector<HTMLButtonElement>('[data-slot~=tooltip-trigger]')!
  await act(async () => trigger.focus())
  await key('{Escape}')
  expect(shown(host.querySelector<HTMLElement>('[role=tooltip]')!)).toBe(false)
  expect(shown(host.querySelector<HTMLElement>('[data-slot=popover-content]')!)).toBe(true)
  expect(document.activeElement).toBe(trigger)
})
for (const mode of ['light', 'dark'] as const)
  test(`${mode}: theme, caller styling, motion and refs reach the span`, async () => {
    const ref = createRef<HTMLSpanElement>()
    const theme = defineTheme({
      id: 'tooltip-proof',
      name: 'Tooltip proof',
      components: { tooltip: { maxWidth: '12rem', padding: '1rem' } }
    })
    const { host } = await mount(
      <ThemeScope
        theme={theme}
        mode={mode}
      >
        <MotionProvider>
          <Tooltip defaultOpen>
            <TooltipTrigger>Export</TooltipTrigger>
            <TooltipPortal>
              <TooltipContent
                ref={ref}
                className="p-0"
              >
                CSV format
              </TooltipContent>
            </TooltipPortal>
          </Tooltip>
        </MotionProvider>
      </ThemeScope>
    )
    const p = parts(host)
    expect(ref.current).toBe(p.panel)
    expect(p.panel.tagName).toBe('SPAN')
    expect(getComputedStyle(p.panel).padding).toBe('0px')
    await act(async () =>
      commands.emulatePreferences({ reducedMotion: 'reduce', forcedColors: 'active' })
    )
    await expect.poll(() => getComputedStyle(p.panel).opacity).toBe('1')
    await click(p.trigger)
    expect(shown(p.panel)).toBe(false)
  })

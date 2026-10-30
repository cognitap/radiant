import { act, createRef, StrictMode } from 'react'
import { expect, test } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import {
  ScrollArea,
  ThemeScope,
  defineTheme,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectPortal,
  SelectItem,
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxPortal,
  ComboboxItem,
  Menu,
  MenuTrigger,
  MenuContent,
  MenuPortal,
  MenuItem
} from '../../src/index.js'
import { mount, click, key, pause, shown } from './familyHarness.js'
const areaStyle = { width: 240, height: 160 }
for (const dir of ['ltr', 'rtl'] as const) {
  test(`${dir}: SSR native edits, sticky geometry and shrinking content retain the real scroll owner`, async () => {
    const ref = createRef<HTMLDivElement>()
    const tree = (large: boolean) => (
      <StrictMode>
        <ScrollArea
          ref={ref}
          aria-label="Scrollable data"
          dir={dir}
          orientation="both"
          visibility="always"
          data-slot="records"
          style={{ ...areaStyle, padding: 8, border: '3px solid', borderRadius: 9 }}
        >
          <div style={{ width: large ? 800 : 20, height: large ? 600 : 20 }}>Data</div>
        </ScrollArea>
      </StrictMode>
    )
    const { host, render } = await mount(tree(true), true, node => {
      const area = node.querySelector<HTMLElement>('[data-slot~="scroll-area"]')!
      expect(area.getAttribute('tabindex')).toBe('0')
      area.scrollTop = 80
      area.scrollLeft = dir === 'rtl' ? -60 : 60
    })
    const node = ref.current!
    expect(node).toBe(host.querySelector('[data-slot~="scroll-area"]'))
    expect(node.dataset.slot).toBe('scroll-area records')
    expect(node.getAttribute('role')).toBe('group')
    expect(node.scrollTop).toBe(80)
    expect(node.scrollLeft).toBe(dir === 'rtl' ? -60 : 60)
    expect(getComputedStyle(node).scrollbarWidth).toBe('none')
    const bar = node.querySelector<HTMLElement>('[data-scroll-area-hit][data-axis="vertical"]')!
    const before = bar.getBoundingClientRect(),
      root = node.getBoundingClientRect()
    expect(before.top - root.top).toBe(11)
    expect(dir === 'rtl' ? before.left - root.left : root.right - before.right).toBe(11)
    await act(async () =>
      node.scrollTo({ top: 1e5, left: dir === 'rtl' ? -1e5 : 1e5, behavior: 'instant' })
    )
    await pause(25)
    const end = bar.getBoundingClientRect()
    expect(end.top).toBe(before.top)
    expect(end.left).toBe(before.left)
    const x = node.scrollWidth - node.clientWidth,
      y = node.scrollHeight - node.clientHeight
    expect(Math.abs(node.scrollLeft)).toBe(x)
    expect(node.scrollTop).toBe(y)
    await render(tree(false))
    expect(node.scrollHeight).toBe(node.clientHeight)
    expect(node.scrollWidth).toBe(node.clientWidth)
    expect(node.scrollLeft).toBe(0)
    expect(node.scrollTop).toBe(0)
    expect(node.querySelector('[data-scroll-area-hit]')).toBeNull()
    await render(tree(true))
    expect(node.scrollHeight - node.clientHeight).toBe(y)
    expect(node.scrollWidth - node.clientWidth).toBe(x)
    await render(null)
    expect(ref.current).toBeNull()
  })
}
test('native keyboard, wheel over content and bars, touch, pointer drag and consumer cancellation stay usable', async () => {
  const ref = createRef<HTMLDivElement>(),
    events: HTMLElement[] = []
  let cancelled = false
  await mount(
    <ScrollArea
      ref={ref}
      id="native-scroll-proof"
      aria-label="Activity"
      visibility="always"
      style={{ width: 260, height: 200, transform: 'scale(1.05)', transformOrigin: 'top left' }}
      onScroll={event => events.push(event.currentTarget)}
      onPointerDown={event => {
        if (cancelled) event.preventDefault()
      }}
    >
      <div style={{ height: 1400 }}>Activity entries</div>
    </ScrollArea>
  )
  const node = ref.current!
  await act(async () => node.focus())
  await key('{ArrowDown}')
  await pause(220)
  expect(node.scrollTop).toBeGreaterThan(0)
  await act(async () => node.scrollTo({ top: 0, behavior: 'instant' }))
  await act(async () => commands.scrollViewport('#native-scroll-proof', 0, 160))
  await pause(100)
  expect(node.scrollTop).toBeGreaterThan(0)
  const before = node.scrollTop
  await act(async () =>
    commands.scrollViewport('#native-scroll-proof [data-scroll-area-hit]', 0, 160)
  )
  await pause(100)
  expect(node.scrollTop).toBeGreaterThan(before)
  await act(async () => node.scrollTo({ top: 0, behavior: 'instant' }))
  await act(async () => commands.scrollViewport('#native-scroll-proof', 0, 70, true))
  await pause(250)
  expect(node.scrollTop).toBeGreaterThan(0)
  await act(async () => node.scrollTo({ top: 0, behavior: 'instant' }))
  await act(async () =>
    commands.dragHandle('#native-scroll-proof [data-scroll-area-thumb-hit]', 0, false, false, 50)
  )
  expect(node.scrollTop).toBeGreaterThan(100)
  expect(document.activeElement).toBe(node)
  expect(node.querySelector('[data-dragging]')).toBeNull()
  expect(node.style.transform).toBe('scale(1.05)')
  expect(events.length).toBeGreaterThan(0)
  expect(events.every(host => host === node)).toBe(true)
  cancelled = true
  await act(async () => node.scrollTo({ top: 0, behavior: 'instant' }))
  await act(async () =>
    commands.dragHandle('#native-scroll-proof [data-scroll-area-thumb-hit]', 0, false, false, 50)
  )
  expect(node.scrollTop).toBe(0)
})
test('scroll visibility, live content measurement, axis updates and visual overrides clean up with their owner', async () => {
  const ref = createRef<HTMLDivElement>(),
    body = createRef<HTMLDivElement>()
  const theme = defineTheme({
    id: 'scroll-style-proof',
    name: 'Scroll proof',
    components: { scrollArea: { size: '9px', radius: '2px', thumbColor: 'rgb(30, 70, 90)' } }
  })
  const { render } = await mount(
    <ThemeScope
      theme={theme}
      mode="dark"
    >
      <ScrollArea
        ref={ref}
        aria-label="Updates"
        visibility="scroll"
        style={areaStyle}
        parts={{ thumb: { className: 'w-3' } }}
      >
        <div
          ref={body}
          style={{ height: 500 }}
        >
          Updates
        </div>
      </ScrollArea>
    </ThemeScope>
  )
  const node = ref.current!,
    thumb = node.querySelector<HTMLElement>('[data-slot="scroll-area-thumb"]')!
  expect(node.querySelector('[data-state="visible"]')).toBeNull()
  await act(async () => {
    node.scrollTop = 50
  })
  await pause(25)
  expect(node.querySelector('[data-state="visible"]')).not.toBeNull()
  expect(getComputedStyle(thumb).width).toBe('12px')
  expect(getComputedStyle(thumb).backgroundColor).toBe('rgb(30, 70, 90)')
  await pause(950)
  expect(node.querySelector('[data-state="visible"]')).toBeNull()
  await act(async () => {
    body.current!.style.height = '20px'
  })
  await pause(50)
  expect(node.querySelector('[data-scroll-area-hit]')).toBeNull()
  await render(
    <ScrollArea
      ref={ref}
      aria-label="Wide records"
      orientation="horizontal"
      visibility="hover"
      style={areaStyle}
    >
      <div style={{ width: 700, height: 30 }}>Wide records</div>
    </ScrollArea>
  )
  expect(ref.current!.querySelector('[data-axis="vertical"]')).toBeNull()
  expect(ref.current!.querySelector('[data-axis="horizontal"]')).not.toBeNull()
  await act(async () => userEvent.hover(ref.current!))
  expect(ref.current!.querySelector('[data-state="visible"]')).not.toBeNull()
  await commands.emulatePreferences({ forcedColors: 'active', reducedMotion: 'reduce' })
  expect(ref.current!.getAttribute('aria-label')).toBe('Wide records')
  await render(null)
  expect(ref.current).toBeNull()
})
const choices = Array.from({ length: 24 }, (_, index) => ({
  value: String(index),
  label: `Choice ${index + 1}`
}))
test('Select, Combobox, Menu and native Dialog retain their focus and selection around a scrolling group', async () => {
  const { host, render } = await mount(
    <Select items={choices}>
      <SelectTrigger aria-label="Choose record">
        <SelectValue placeholder="Choose record" />
      </SelectTrigger>
      <SelectPortal>
        <SelectContent>
          <ScrollArea
            aria-label="Available records"
            tabIndex={-1}
            visibility="always"
            style={{ maxHeight: 120 }}
          >
            {choices.map(item => (
              <SelectItem
                key={item.value}
                value={item.value}
              >
                {item.label}
              </SelectItem>
            ))}
          </ScrollArea>
        </SelectContent>
      </SelectPortal>
    </Select>
  )
  await click(host.querySelector('[data-slot~="select-trigger"]')!)
  const selectArea = document.querySelector<HTMLElement>('[data-slot~="scroll-area"]')!
  expect(selectArea.scrollHeight).toBeGreaterThan(selectArea.clientHeight)
  await key('{End}')
  expect(selectArea.scrollTop).toBeGreaterThan(0)
  await key('{Enter}')
  expect(host.querySelector('[data-slot~="select-trigger"]')!.textContent).toContain('Choice 24')
  await render(
    <Combobox items={choices}>
      <ComboboxInput aria-label="Find record" />
      <ComboboxPortal>
        <ComboboxContent>
          <ScrollArea
            id="combo-scroll-proof"
            aria-label="Matching records"
            tabIndex={-1}
            style={{ maxHeight: 120 }}
          >
            {choices.map(item => (
              <ComboboxItem
                key={item.value}
                value={item.value}
              >
                {item.label}
              </ComboboxItem>
            ))}
          </ScrollArea>
        </ComboboxContent>
      </ComboboxPortal>
    </Combobox>
  )
  const input = host.querySelector<HTMLInputElement>('[data-slot="combobox-input"]')!
  await click(input)
  await key('{ArrowDown}')
  const comboArea = document.getElementById('combo-scroll-proof')!
  await act(async () => userEvent.hover(comboArea))
  await act(async () =>
    commands.dragHandle(
      '#combo-scroll-proof [data-scroll-area-thumb-hit][data-axis="vertical"]',
      0,
      false,
      false,
      20
    )
  )
  expect(document.activeElement).toBe(input)
  await key('{ArrowDown}'.repeat(23))
  expect(
    document.querySelector<HTMLElement>('[data-slot~="scroll-area"]')!.scrollTop
  ).toBeGreaterThan(0)
  await key('{Enter}')
  expect(input.value).toBe('Choice 24')
  let selected = ''
  await render(
    <Menu>
      <MenuTrigger>Commands</MenuTrigger>
      <MenuPortal>
        <MenuContent>
          <ScrollArea
            aria-label="Commands list"
            tabIndex={-1}
            style={{ maxHeight: 120 }}
          >
            {choices.map(item => (
              <MenuItem
                key={item.value}
                onSelect={() => {
                  selected = item.value
                }}
              >
                {item.label}
              </MenuItem>
            ))}
          </ScrollArea>
        </MenuContent>
      </MenuPortal>
    </Menu>
  )
  await click(host.querySelector('[data-slot~="menu-trigger"]')!)
  const menu = document.querySelector<HTMLElement>('[role="menu"]')!
  expect(shown(menu)).toBe(true)
  await key('{End}{Enter}')
  expect(selected).toBe('23')
  await render(
    <Dialog defaultOpen>
      <DialogContent>
        <DialogTitle>Long history</DialogTitle>
        <ScrollArea
          aria-label="History"
          style={areaStyle}
        >
          <div style={{ height: 800 }}>History entries</div>
        </ScrollArea>
        <DialogClose>Close history</DialogClose>
      </DialogContent>
    </Dialog>
  )
  const dialog = host.querySelector('dialog')!,
    area = dialog.querySelector<HTMLElement>('[data-slot~="scroll-area"]')!
  expect(dialog.open).toBe(true)
  await act(async () => area.focus())
  await key('{ArrowDown}')
  await pause(220)
  expect(area.scrollTop).toBeGreaterThan(0)
  await click(dialog.querySelector('[data-slot~="dialog-close"]')!)
  expect(dialog.open).toBe(false)
})

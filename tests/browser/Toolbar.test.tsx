import { act, StrictMode, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { afterEach, expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import {
  Toolbar,
  Button,
  Link,
  ToggleGroup,
  ToggleGroupItem,
  Separator,
  Menu,
  MenuTrigger,
  MenuPortal,
  MenuContent,
  MenuItem,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose,
  Popover,
  PopoverTrigger,
  PopoverContent
} from '../../src/index.js'
import { renderToString } from 'react-dom/server'
import type {} from './mediaCommands.js'
import '../../.storybook/styles.css'
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const roots: Root[] = [],
  hosts: HTMLElement[] = []
async function mount(children: ReactNode) {
  const host = document.createElement('div')
  document.body.append(host)
  hosts.push(host)
  const root = createRoot(host)
  roots.push(root)
  await act(async () => root.render(<StrictMode>{children}</StrictMode>))
  return { host, root }
}
afterEach(async () => {
  for (const root of roots.splice(0)) await act(async () => root.unmount())
  hosts.splice(0).forEach(host => host.remove())
  await commands.emulatePreferences({ forcedColors: 'none', reducedMotion: 'no-preference' })
})
test('one tab stop spans actual Buttons, ToggleGroup, Link and Menu without entering menu focus', async () => {
  const { host } = await mount(
    <>
      <Toolbar aria-label="Editor">
        <Button disabled>Unavailable</Button>
        <Button>Undo</Button>
        <ToggleGroup
          aria-label="Formatting"
          type="multiple"
          defaultValue={['bold']}
        >
          <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
          <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
        </ToggleGroup>
        <Separator
          orientation="vertical"
          decorative
        />
        <Menu>
          <MenuTrigger>More</MenuTrigger>
          <MenuPortal>
            <MenuContent>
              <MenuItem>Export</MenuItem>
              <MenuItem>Print</MenuItem>
            </MenuContent>
          </MenuPortal>
        </Menu>
        <Link href="#toolbar-guide">Guide</Link>
      </Toolbar>
      <button>After</button>
      <section id="toolbar-guide">Guide content</section>
    </>
  )
  const toolbar = host.querySelector('[role="toolbar"]')!,
    buttons = Array.from(toolbar.querySelectorAll<HTMLButtonElement>('button')),
    undo = buttons.find(button => button.textContent === 'Undo')!,
    bold = buttons.find(button => button.textContent === 'Bold')!,
    italic = buttons.find(button => button.textContent === 'Italic')!,
    more = buttons.find(button => button.textContent === 'More')!,
    link = toolbar.querySelector('a')!
  expect(
    Array.from(toolbar.querySelectorAll<HTMLElement>('button,a')).filter(
      item => item.tabIndex === 0
    )
  ).toEqual([undo])
  await act(async () => undo.focus())
  await act(async () => userEvent.keyboard('{ArrowRight}'))
  expect(bold).toHaveFocus()
  await act(async () => userEvent.keyboard(' '))
  expect(bold).toHaveAttribute('aria-pressed', 'false')
  await act(async () => userEvent.keyboard('{ArrowRight}'))
  expect(italic).toHaveFocus()
  await act(async () => userEvent.keyboard('{ArrowRight}'))
  expect(more).toHaveFocus()
  await act(async () => userEvent.keyboard('{ArrowDown}'))
  const menu = host.querySelector('[role="menu"]')!,
    item = menu.querySelector('button')!
  expect(item).toHaveFocus()
  expect(more.tabIndex).toBe(0)
  await act(async () => userEvent.keyboard('{ArrowRight}'))
  expect(item).toHaveFocus()
  await act(async () => userEvent.keyboard('{Escape}'))
  expect(more).toHaveFocus()
  await act(async () => userEvent.keyboard('{ArrowRight}'))
  expect(link).toHaveFocus()
  expect(link.getAttribute('href')).toBe('#toolbar-guide')
  await act(async () => userEvent.keyboard('{Tab}'))
  expect(host.querySelector(':scope > button')).toHaveFocus()
})
test('a ToggleGroup inside an actual Dialog nested under Toolbar keeps its own roving scope', async () => {
  const { host } = await mount(
    <Toolbar aria-label="Document">
      <Dialog>
        <DialogTrigger>Configure</DialogTrigger>
        <DialogContent>
          <DialogTitle>View options</DialogTitle>
          <ToggleGroup
            aria-label="View"
            defaultValue="a"
          >
            <ToggleGroupItem value="a">Alpha</ToggleGroupItem>
            <ToggleGroupItem value="b">Beta</ToggleGroupItem>
          </ToggleGroup>
          <DialogClose>Close</DialogClose>
        </DialogContent>
      </Dialog>
    </Toolbar>
  )
  await act(async () => userEvent.click(host.querySelector('[data-slot~="dialog-trigger"]')!))
  expect(host.querySelector('dialog')!.matches(':modal')).toBe(true)
  const group = host.querySelector('[data-slot~="toggle-group"]')!,
    buttons = Array.from(group.querySelectorAll('button'))
  expect(buttons.filter(button => button.tabIndex === 0)).toHaveLength(1)
  await act(async () => buttons[0].focus())
  await act(async () => userEvent.keyboard('{ArrowRight}'))
  expect(buttons[1]).toHaveFocus()
  expect(buttons[0]).toHaveAttribute('aria-pressed', 'true')
})

test('RTL, vertical navigation, Home/End, non-looping edges, cancellation and changing native disabled states share one entry', async () => {
  const observed = vi.fn(),
    view = (orientation: 'horizontal' | 'vertical' = 'horizontal', cancel = false) => (
      <fieldset>
        <legend>Tools</legend>
        <Toolbar
          aria-label="Tools"
          dir="rtl"
          orientation={orientation}
          loop={false}
          onKeyDown={event => {
            observed(event.currentTarget.tagName)
            if (cancel) event.preventDefault()
          }}
        >
          <Button>Alpha</Button>
          <Button>Beta</Button>
          <Button>Gamma</Button>
        </Toolbar>
      </fieldset>
    )
  const { host, root } = await mount(view()),
    buttons = Array.from(host.querySelectorAll('button')),
    toolbar = host.querySelector('[role="toolbar"]')!,
    entry = () => buttons.filter(button => button.tabIndex === 0)
  await act(async () => buttons[0].focus())
  await act(async () => userEvent.keyboard('{ArrowLeft}'))
  expect(buttons[1]).toHaveFocus()
  await act(async () => userEvent.keyboard('{End}'))
  expect(buttons[2]).toHaveFocus()
  await act(async () => userEvent.keyboard('{ArrowLeft}'))
  expect(buttons[2]).toHaveFocus()
  await act(async () => userEvent.keyboard('{Home}'))
  expect(buttons[0]).toHaveFocus()
  await act(async () => userEvent.keyboard('{ArrowRight}'))
  expect(buttons[0]).toHaveFocus()
  expect(observed.mock.calls.every(call => call[0] === 'DIV')).toBe(true)
  await act(async () => root.render(<StrictMode>{view('vertical')}</StrictMode>))
  expect(toolbar).toHaveAttribute('aria-orientation', 'vertical')
  await act(async () => userEvent.keyboard('{ArrowDown}'))
  expect(buttons[1]).toHaveFocus()
  await act(async () => root.render(<StrictMode>{view('vertical', true)}</StrictMode>))
  await act(async () => userEvent.keyboard('{ArrowDown}'))
  expect(buttons[1]).toHaveFocus()
  await act(async () => {
    host.querySelector('fieldset')!.disabled = true
  })
  await expect.poll(() => entry().length).toBe(0)
  await act(async () => {
    host.querySelector('fieldset')!.disabled = false
  })
  await expect.poll(() => entry().length).toBe(1)
  await act(async () => {
    entry()[0].disabled = true
  })
  await expect.poll(() => entry().length).toBe(1)
  expect(entry()[0].disabled).toBe(false)
})

test('Toolbar hydrates its actual named host, merges caller utilities and honors ref cleanup and native focus cues', async () => {
  let native: HTMLDivElement | null = null
  const cleanup = vi.fn(() => {
      native = null
    }),
    ref = vi.fn((node: HTMLDivElement | null) => {
      native = node
      if (node) return cleanup
    }),
    children = (
      <>
        <h2 id="toolbar-title">Commands</h2>
        <button>Before</button>
        <Toolbar
          aria-labelledby="toolbar-title"
          ref={ref}
          id="commands"
          data-slot="custom"
          className="gap-7 p-3 rounded-none"
          style={{ '--rad-toolbar-radius': '19px' }}
        >
          <Button>Save</Button>
          <Link href="#toolbar-title">Help</Link>
        </Toolbar>
        <button>After</button>
      </>
    )
  const host = document.createElement('div')
  host.innerHTML = renderToString(<StrictMode>{children}</StrictMode>)
  document.body.append(host)
  hosts.push(host)
  const original = host.querySelector('[role="toolbar"]'),
    errors: unknown[] = []
  expect(ref).not.toHaveBeenCalled()
  await act(async () => {
    roots.push(
      hydrateRoot(host, <StrictMode>{children}</StrictMode>, {
        onRecoverableError: error => errors.push(error)
      })
    )
  })
  const toolbar = host.querySelector<HTMLDivElement>('[role="toolbar"]')!,
    save = toolbar.querySelector('button')!
  expect(errors).toEqual([])
  expect(toolbar).toBe(original)
  expect(native).toBe(toolbar)
  expect(toolbar.id).toBe('commands')
  expect(toolbar).toHaveAttribute('data-slot', 'toolbar custom')
  expect(toolbar.tabIndex).toBe(-1)
  expect(getComputedStyle(toolbar).gap).toBe('28px')
  expect(getComputedStyle(toolbar).padding).toBe('12px')
  expect(getComputedStyle(toolbar).borderRadius).toBe('0px')
  await commands.emulatePreferences({ forcedColors: 'active', reducedMotion: 'reduce' })
  await act(async () => host.querySelector<HTMLButtonElement>(':scope > button')!.focus())
  await act(async () => userEvent.keyboard('{Tab}'))
  expect(save).toHaveFocus()
  expect(getComputedStyle(save).outlineStyle).not.toBe('none')
  const cleaned = cleanup.mock.calls.length
  await act(async () => roots.at(-1)!.render(null))
  expect(cleanup).toHaveBeenCalledTimes(cleaned + 1)
  expect(native).toBe(null)
})

test('a Toolbar inside an actual Popover retains its own tab entry and keyboard navigation', async () => {
  const { host } = await mount(
      <Popover defaultOpen>
        <PopoverTrigger>Open tools</PopoverTrigger>
        <PopoverContent>
          <Toolbar aria-label="Popup tools">
            <Button>Alpha</Button>
            <Button>Beta</Button>
          </Toolbar>
        </PopoverContent>
      </Popover>
    ),
    toolbar = host.querySelector('[role="toolbar"]')!,
    buttons = Array.from(toolbar.querySelectorAll('button'))
  await expect.poll(() => buttons.filter(button => button.tabIndex === 0).length).toBe(1)
  await act(async () => buttons[0].focus())
  await act(async () => userEvent.keyboard('{ArrowRight}'))
  expect(buttons[1]).toHaveFocus()
  await act(async () => userEvent.keyboard('{Escape}'))
  expect(host.querySelector('[data-slot~="popover-trigger"]')).toHaveFocus()
})

test('a segmented ToggleGroup follows changes to its Toolbar ancestor native direction', async () => {
  const view = (dir: 'ltr' | 'rtl') => (
    <Toolbar
      aria-label="Tools"
      dir={dir}
    >
      <ToggleGroup
        aria-label="View"
        variant="segmented"
        defaultValue="b"
        motion="off"
      >
        <ToggleGroupItem value="a">Alpha</ToggleGroupItem>
        <ToggleGroupItem value="b">Beta</ToggleGroupItem>
      </ToggleGroup>
    </Toolbar>
  )
  const { host, root } = await mount(view('ltr')),
    group = host.querySelector('[data-slot~="toggle-group"]')!,
    selected = group.querySelector('[aria-pressed="true"]')!,
    marker = group.querySelector('[data-slot="toggle-group-indicator"]')!.parentElement!,
    aligned = () =>
      Math.abs(selected.getBoundingClientRect().left - marker.getBoundingClientRect().left) < 1
  await expect.poll(aligned).toBe(true)
  await new Promise<void>(resolve =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  )
  await act(async () => root.render(<StrictMode>{view('rtl')}</StrictMode>))
  await expect.poll(aligned, { timeout: 1500 }).toBe(true)
})

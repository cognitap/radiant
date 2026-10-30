import { act, createRef, StrictMode } from 'react'
import { expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarPortal,
  MenubarContent,
  MenubarItem,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  ThemeScope,
  defineTheme
} from '../../src/index.js'
import { MotionProvider } from '../../src/motion/react.js'
import { mount, click, key, shown } from './familyHarness.js'
function Editor({
  value,
  initial = null,
  change,
  dir = 'ltr',
  loop = true,
  disabled = false,
  pending = false,
  showEdit = true
}: {
  value?: string | null
  initial?: string | null
  change?: (value: string | null) => void
  dir?: 'ltr' | 'rtl'
  loop?: boolean
  disabled?: boolean
  pending?: boolean
  showEdit?: boolean
}) {
  return (
    <>
      <Button>Before bar</Button>
      <Menubar
        {...(value === undefined ? { defaultValue: initial } : { value })}
        onValueChange={change}
        aria-label="Editor commands"
        dir={dir}
        loop={loop}
        style={{ position: 'fixed', left: 300, top: 80 }}
      >
        <MenubarMenu value="file">
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarPortal>
            <MenubarContent motion="off">
              <MenubarItem>Save</MenubarItem>
              <MenubarSub>
                <MenubarSubTrigger>Export</MenubarSubTrigger>
                <MenubarPortal>
                  <MenubarSubContent motion="off">
                    <MenubarItem>PDF</MenubarItem>
                    <MenubarItem>CSV</MenubarItem>
                  </MenubarSubContent>
                </MenubarPortal>
              </MenubarSub>
            </MenubarContent>
          </MenubarPortal>
        </MenubarMenu>
        {showEdit && (
          <MenubarMenu value="edit">
            <MenubarTrigger
              disabled={disabled}
              pending={pending}
            >
              Edit
            </MenubarTrigger>
            <MenubarPortal>
              <MenubarContent motion="off">
                <MenubarItem>Undo</MenubarItem>
                <MenubarItem>Redo</MenubarItem>
              </MenubarContent>
            </MenubarPortal>
          </MenubarMenu>
        )}
        <MenubarMenu value="view">
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarPortal>
            <MenubarContent motion="off">
              <MenubarCheckboxItem defaultChecked>Grid lines</MenubarCheckboxItem>
              <MenubarRadioGroup
                aria-label="Layout"
                defaultValue="list"
              >
                <MenubarRadioItem value="list">List</MenubarRadioItem>
                <MenubarRadioItem value="board">Board</MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarContent>
          </MenubarPortal>
        </MenubarMenu>
      </Menubar>
      <Button>After bar</Button>
    </>
  )
}
function parts(host: HTMLElement) {
  return {
    bar: host.querySelector<HTMLDivElement>('[role="menubar"]')!,
    titles: Array.from(host.querySelectorAll<HTMLButtonElement>('[data-slot~="menubar-trigger"]')),
    panels: Array.from(host.querySelectorAll<HTMLDivElement>('[data-slot~="menubar-content"]')),
    before: host.querySelector<HTMLButtonElement>('button')!,
    after: Array.from(host.querySelectorAll<HTMLButtonElement>('button')).at(-1)!
  }
}
test('one native Tab entry, horizontal closed navigation, wrapping, Home/End and entry from outside survive hydration', async () => {
  const { host } = await mount(
      <StrictMode>
        <Editor />
      </StrictMode>,
      true
    ),
    p = parts(host)
  expect(p.bar).toHaveAttribute('aria-label', 'Editor commands')
  expect(p.bar).toHaveAttribute('aria-orientation', 'horizontal')
  expect(p.titles.map(n => n.tabIndex)).toEqual([0, -1, -1])
  await act(async () => p.before.focus())
  await key('{Tab}')
  expect(document.activeElement).toBe(p.titles[0])
  await key('{ArrowRight}')
  expect(document.activeElement).toBe(p.titles[1])
  expect(p.panels.some(shown)).toBe(false)
  await key('{End}')
  expect(document.activeElement).toBe(p.titles[2])
  await key('{ArrowRight}')
  expect(document.activeElement).toBe(p.titles[0])
  await key('{Home}')
  await key('{Tab}')
  expect(document.activeElement).toBe(p.after)
  expect(p.titles.filter(n => n.tabIndex === 0)).toHaveLength(1)
})
test('Up opens the last item, open arrows switch menus without an intervening close, and Tab leaves the entire bar', async () => {
  const change = vi.fn(),
    { host } = await mount(<Editor change={change} />),
    p = parts(host)
  await act(async () => p.titles[0].focus())
  await key('{ArrowUp}')
  expect(shown(p.panels[0])).toBe(true)
  expect(document.activeElement?.textContent).toContain('Export')
  await key('{ArrowLeft}')
  expect(shown(p.panels[2])).toBe(true)
  expect(document.activeElement?.textContent).toContain('Grid lines')
  await key('{ArrowRight}')
  expect(shown(p.panels[0])).toBe(true)
  expect(document.activeElement?.textContent).toContain('Save')
  expect(change.mock.calls.map(call => call[0])).toEqual(['file', 'view', 'file'])
  await key('{Tab}')
  expect(document.activeElement).toBe(p.after)
  expect(p.panels.some(shown)).toBe(false)
})
test('pointer switching an open bar focuses the accepted title and inside-bar focus never clears the new owner', async () => {
  const change = vi.fn(),
    { host } = await mount(<Editor change={change} />),
    p = parts(host)
  await click(p.titles[0])
  await act(async () => userEvent.hover(p.titles[1]))
  expect(shown(p.panels[0])).toBe(false)
  expect(shown(p.panels[1])).toBe(true)
  expect(document.activeElement).toBe(p.titles[1])
  expect(change.mock.calls.map(call => call[0])).toEqual(['file', 'edit'])
  await key('{ArrowDown}')
  expect(document.activeElement?.textContent).toBe('Undo')
  await key('{Escape}')
  expect(document.activeElement).toBe(p.titles[1])
  expect(p.panels.some(shown)).toBe(false)
})
test('controlled refusal does not move focus or reset the current menu; prop synchronization emits no request', async () => {
  const change = vi.fn(),
    { host, render } = await mount(
      <Editor
        value="file"
        change={change}
      />
    ),
    p = parts(host),
    save = p.panels[0].querySelector<HTMLButtonElement>('button')!
  expect(document.activeElement).toBe(save)
  await key('{ArrowRight}')
  expect(change).toHaveBeenCalledExactlyOnceWith('edit')
  expect(document.activeElement).toBe(save)
  expect(shown(p.panels[0])).toBe(true)
  await render(
    <Editor
      value="edit"
      change={change}
    />
  )
  expect(change).toHaveBeenCalledTimes(1)
  expect(document.activeElement?.textContent).toBe('Undo')
  await click(p.after)
  expect(change).toHaveBeenLastCalledWith(null)
  expect(shown(p.panels[1])).toBe(true)
  expect(document.activeElement).toBe(p.after)
  await render(
    <Editor
      value={null}
      change={change}
    />
  )
  expect(p.panels.some(shown)).toBe(false)
  expect(document.activeElement).toBe(p.after)
})
test('disabled and pending titles remain discoverable while activation and pointer opening are guarded', async () => {
  const change = vi.fn(),
    { host, render } = await mount(
      <Editor
        initial="file"
        disabled
        change={change}
      />
    ),
    p = parts(host)
  await key('{ArrowRight}')
  expect(document.activeElement).toBe(p.titles[1])
  expect(p.titles[1].disabled).toBe(false)
  expect(p.titles[1]).toHaveAttribute('aria-disabled', 'true')
  await key('{Enter}')
  expect(shown(p.panels[0])).toBe(true)
  expect(change).not.toHaveBeenCalled()
  await key('{ArrowRight}')
  expect(shown(p.panels[2])).toBe(true)
  expect(document.activeElement?.textContent).toContain('Grid lines')
  await render(
    <Editor
      initial="file"
      pending
      change={change}
    />
  )
  await act(async () => userEvent.hover(p.titles[1]))
  expect(shown(p.panels[2])).toBe(true)
  await click(p.titles[1])
  expect(shown(p.panels[1])).toBe(false)
  expect(p.titles[1]).toHaveAttribute('aria-busy', 'true')
})
test('submenu forward arrows enter children, backward closes only the child, and a forward leaf switches the bar in both directions', async () => {
  const { host, render } = await mount(<Editor initial="file" />),
    p = parts(host)
  await key('{End}')
  await key('{ArrowRight}')
  let child = host.querySelector<HTMLDivElement>('[data-slot~="menubar-sub-content"]')!
  expect(shown(child)).toBe(true)
  expect(document.activeElement?.textContent).toBe('PDF')
  await key('{ArrowLeft}')
  expect(shown(child)).toBe(false)
  expect(shown(p.panels[0])).toBe(true)
  await key('{ArrowRight}')
  await key('{ArrowRight}')
  expect(shown(p.panels[1])).toBe(true)
  expect(shown(child)).toBe(false)
  expect(document.activeElement?.textContent).toBe('Undo')
  await key('{Escape}')
  await render(
    <Editor
      initial="file"
      dir="rtl"
    />
  )
  await act(async () => p.titles[0].focus())
  await key('{ArrowDown}')
  await key('{End}')
  await key('{ArrowLeft}')
  child = host.querySelector<HTMLDivElement>('[data-slot~="menubar-sub-content"]')!
  expect(shown(child)).toBe(true)
  await key('{ArrowRight}')
  expect(shown(child)).toBe(false)
  await key('{ArrowLeft}')
  await key('{ArrowLeft}')
  expect(shown(p.panels[1])).toBe(true)
  expect(document.activeElement?.textContent).toBe('Undo')
})
test('live direction, non-wrapping boundaries and dynamic titles keep one entry and honor consumer cancellation', async () => {
  const { host, render } = await mount(<Editor loop={false} />),
    p = parts(host)
  await act(async () => p.titles[0].focus())
  await key('{ArrowLeft}')
  expect(document.activeElement).toBe(p.titles[0])
  await render(
    <Editor
      loop={false}
      dir="rtl"
      showEdit={false}
    />
  )
  const titles = parts(host).titles
  await key('{ArrowLeft}')
  expect(document.activeElement).toBe(titles[1])
  await key('{ArrowLeft}')
  expect(document.activeElement).toBe(titles[1])
  expect(titles.filter(n => n.tabIndex === 0)).toHaveLength(1)
  await render(
    <Menubar
      aria-label="Guarded"
      onKeyDown={e => e.preventDefault()}
    >
      <MenubarMenu value="one">
        <MenubarTrigger onClick={e => e.preventDefault()}>One</MenubarTrigger>
        <MenubarContent onKeyDown={e => e.preventDefault()}>
          <MenubarItem>Action</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu value="two">
        <MenubarTrigger>Two</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Other</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  )
  const q = parts(host)
  await click(q.titles[0])
  expect(q.panels.some(shown)).toBe(false)
  await act(async () => q.titles[0].focus())
  await key('{ArrowRight}')
  expect(document.activeElement).toBe(q.titles[0])
  await key('{ArrowDown}')
  expect(shown(q.panels[0])).toBe(true)
  await key('{ArrowRight}')
  expect(shown(q.panels[0])).toBe(true)
})
test('native form actions, adapter refs, caller styles, forced colors and cleanup retain their real hosts', async () => {
  const root = createRef<HTMLDivElement>(),
    content = createRef<HTMLDivElement>(),
    cleanup = vi.fn(),
    ref = vi.fn(() => cleanup),
    submitted = vi.fn(),
    { host, render } = await mount(
      <ThemeScope
        theme={defineTheme({
          id: 'menubar-native',
          name: 'Menubar native',
          components: {
            menubar: { gap: '9px', padding: '7px', radius: '13px', background: '#ffffff' }
          }
        })}
      >
        <form
          onSubmit={e => {
            e.preventDefault()
            submitted(new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter))
          }}
        >
          <input
            aria-label="Report title"
            name="title"
            defaultValue="Brief"
          />
          <Menubar
            aria-label="Report actions"
            ref={root}
            data-slot="custom"
            style={{ width: 320 }}
          >
            <MenubarMenu value="file">
              <MenubarTrigger
                ref={ref}
                render={props => <button {...props}>{props.children}</button>}
              >
                File
              </MenubarTrigger>
              <MenubarPortal>
                <MenubarContent
                  ref={content}
                  style={{ width: 210 }}
                  motion="off"
                >
                  <MenubarItem
                    type="submit"
                    name="intent"
                    value="publish"
                  >
                    Publish
                  </MenubarItem>
                </MenubarContent>
              </MenubarPortal>
            </MenubarMenu>
          </Menubar>
        </form>
      </ThemeScope>,
      true
    ),
    p = parts(host)
  expect(root.current).toBe(p.bar)
  expect(p.bar.dataset.slot).toBe('menubar custom')
  expect(p.bar.offsetWidth).toBe(320)
  expect(getComputedStyle(p.bar).gap).toBe('9px')
  expect(getComputedStyle(p.bar).padding).toBe('7px')
  expect(getComputedStyle(p.bar).borderRadius).toBe('13px')
  expect(p.titles[0].dataset.slot).toBe('button popover-trigger menu-trigger menubar-trigger')
  await click(p.titles[0])
  expect(content.current).toBe(p.panels[0])
  expect(content.current!.offsetWidth).toBe(210)
  expect(content.current!.previousElementSibling).toBe(p.titles[0])
  await key('{Enter}')
  expect(submitted).toHaveBeenCalledOnce()
  const data = submitted.mock.calls[0][0]
  expect(data.get('title')).toBe('Brief')
  expect(data.get('intent')).toBe('publish')
  await commands.emulatePreferences({ forcedColors: 'active', reducedMotion: 'reduce' })
  await click(p.titles[0])
  expect(shown(p.panels[0])).toBe(true)
  await render(<div />)
  expect(root.current).toBe(null)
  expect(content.current).toBe(null)
  expect(cleanup).toHaveBeenCalledTimes(1)
})
test('independent nested menus and native dialogs keep their own focus scopes', async () => {
  const { host } = await mount(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Editor</DialogTitle>
          <Editor />
          <Menu>
            <MenuTrigger>Independent commands</MenuTrigger>
            <MenuContent>
              <MenuItem>Independent action</MenuItem>
            </MenuContent>
          </Menu>
        </DialogContent>
      </Dialog>
    ),
    p = parts(host)
  await click(p.titles[0])
  expect(p.panels[0].closest('dialog')).toBe(host.querySelector('dialog'))
  await key('{Escape}')
  expect(host.querySelector('dialog')!.open).toBe(true)
  await click(
    host.querySelector<HTMLButtonElement>(
      '[data-slot~="menu-trigger"]:not([data-slot~="menubar-trigger"])'
    )!
  )
  await key('{ArrowRight}')
  expect(document.activeElement?.textContent).toBe('Independent action')
  expect(p.panels.some(shown)).toBe(false)
})

test('an open menu follows its title when the live bar direction changes', async () => {
  const { host, render } = await mount(<Editor initial="file" />),
    p = parts(host)
  expect(shown(p.panels[0])).toBe(true)
  await render(
    <Editor
      initial="file"
      dir="rtl"
    />
  )
  await act(async () =>
    vi.waitFor(
      () =>
        expect(
          Math.abs(
            p.panels[0].getBoundingClientRect().right - p.titles[0].getBoundingClientRect().right
          )
        ).toBeLessThan(1),
      { timeout: 1200 }
    )
  )
})

test('touch preserves disabled title discovery without press feedback or activation', async () => {
  const { host } = await mount(
      <MotionProvider>
        <Editor disabled />
      </MotionProvider>
    ),
    p = parts(host)
  let pressed = false
  await act(async () => {
    pressed = await commands.touchButton('[data-slot~="menubar-trigger"][data-value="file"]', false)
  })
  expect(pressed).toBe(true)
  expect(shown(p.panels[0])).toBe(true)
  await key('{Escape}')
  await act(async () => {
    pressed = await commands.touchButton('[data-slot~="menubar-trigger"][data-value="edit"]', false)
  })
  expect(pressed).toBe(false)
  expect(p.panels.some(shown)).toBe(false)
  expect(p.titles[1].disabled).toBe(false)
})

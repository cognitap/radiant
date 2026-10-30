import { act, createRef, StrictMode } from 'react'
import { expect, test, vi } from 'vitest'
import { commands } from 'vitest/browser'
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuPortal,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  ThemeScope,
  defineTheme,
  useContextMenu
} from '../../src/index.js'
import { mount, click, key, shown, pause } from './familyHarness.js'
function Fixture({
  open,
  change,
  veto = false,
  dir = 'ltr'
}: {
  open?: boolean
  change?: (open: boolean) => void
  veto?: boolean
  dir?: 'ltr' | 'rtl'
}) {
  return (
    <div dir={dir}>
      <ContextMenu
        {...(open === undefined ? {} : { open })}
        onOpenChange={change}
      >
        <ContextMenuTrigger
          aria-label="Project file"
          dir={dir}
          style={{ width: 500, height: 250 }}
          onContextMenu={e => {
            if (veto) e.preventDefault()
          }}
        >
          <Button>Visible rename</Button>
        </ContextMenuTrigger>
        <ContextMenuPortal>
          <ContextMenuContent motion="off">
            <ContextMenuItem>Rename</ContextMenuItem>
            <ContextMenuCheckboxItem defaultChecked>Shared</ContextMenuCheckboxItem>
            <ContextMenuRadioGroup
              defaultValue="list"
              aria-label="Layout"
            >
              <ContextMenuRadioItem value="list">List</ContextMenuRadioItem>
              <ContextMenuRadioItem value="grid">Grid</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
            <ContextMenuSub>
              <ContextMenuSubTrigger>Move to</ContextMenuSubTrigger>
              <ContextMenuPortal>
                <ContextMenuSubContent motion="off">
                  <ContextMenuItem>Archive</ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuPortal>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenuPortal>
      </ContextMenu>
    </div>
  )
}
const parts = (host: HTMLElement) => ({
  target: host.querySelector<HTMLDivElement>('[data-slot~="context-menu-trigger"]')!,
  panel: host.querySelector<HTMLDivElement>('[data-slot~="context-menu-content"]')!
})
async function context(node: HTMLElement, x: number, y: number) {
  await act(async () => {
    node.dispatchEvent(
      new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        button: 2
      })
    )
  })
}
test('pointer placement uses the requested viewport point, repositions an open menu and clamps at viewport edges', async () => {
  const { host } = await mount(
      <StrictMode>
        <Fixture />
      </StrictMode>,
      true
    ),
    p = parts(host)
  await context(p.target, 120, 100)
  expect(shown(p.panel)).toBe(true)
  expect(p.panel.getBoundingClientRect().left).toBeCloseTo(120, 0)
  expect(p.panel.getBoundingClientRect().top).toBeCloseTo(100, 0)
  expect(document.activeElement?.textContent).toContain('Rename')
  await context(p.target, 240, 160)
  expect(p.panel.getBoundingClientRect().left).toBeCloseTo(240, 0)
  expect(p.panel.getBoundingClientRect().top).toBeCloseTo(160, 0)
  await context(p.target, innerWidth - 1, innerHeight - 1)
  const rect = p.panel.getBoundingClientRect()
  expect(rect.right).toBeLessThanOrEqual(innerWidth - 7)
  expect(rect.bottom).toBeLessThanOrEqual(innerHeight - 7)
  await key('{Escape}')
  expect(shown(p.panel)).toBe(false)
  expect(document.activeElement).toBe(p.target)
})
test('Shift+F10 and Menu key open at the focused native child and Tab continues from the named target', async () => {
  const { host } = await mount(
      <>
        <Fixture />
        <Button>After target</Button>
      </>
    ),
    p = parts(host),
    visible = host.querySelector<HTMLButtonElement>('button')!
  await act(async () => visible.focus())
  await key('{Shift>}{F10}{/Shift}')
  const rect = visible.getBoundingClientRect()
  expect(p.panel.getBoundingClientRect().top).toBeCloseTo(rect.bottom, 0)
  expect(p.panel.getAttribute('aria-labelledby')).toBe(p.target.id)
  await key('{Escape}')
  await key('{ContextMenu}')
  expect(shown(p.panel)).toBe(true)
  await key('{Tab}')
  expect(shown(p.panel)).toBe(false)
  expect(document.activeElement).toBe(visible)
})
test('controlled refusal and cancelled invocation preserve their owners', async () => {
  const change = vi.fn(),
    { host, render } = await mount(
      <Fixture
        open={false}
        change={change}
      />
    ),
    p = parts(host)
  await context(p.target, 100, 100)
  expect(change).toHaveBeenCalledExactlyOnceWith(true)
  expect(shown(p.panel)).toBe(false)
  await render(
    <Fixture
      open={false}
      change={change}
      veto
    />
  )
  await context(p.target, 100, 100)
  expect(change).toHaveBeenCalledTimes(1)
  await act(async () => p.target.focus())
  await key('{Shift>}{F10}{/Shift}')
  expect(change).toHaveBeenCalledTimes(2)
})
test('context menus reuse checked state, radio choices, submenu focus and full-tree command dismissal', async () => {
  const { host } = await mount(<Fixture />),
    p = parts(host)
  await context(p.target, 100, 100)
  await key('{ArrowDown}')
  await key(' ')
  expect(p.panel.querySelector('[role="menuitemcheckbox"]')).toHaveAttribute(
    'aria-checked',
    'false'
  )
  expect(shown(p.panel)).toBe(true)
  await key('{End}')
  await key('{ArrowRight}')
  const child = host.querySelector<HTMLDivElement>('[data-slot~="context-menu-sub-content"]')!
  expect(shown(child)).toBe(true)
  expect(document.activeElement?.textContent).toContain('Archive')
  await key('{ArrowLeft}')
  expect(shown(child)).toBe(false)
  await key('{ArrowRight}')
  await key('{Enter}')
  expect(shown(child)).toBe(false)
  expect(shown(p.panel)).toBe(false)
  expect(document.activeElement).toBe(p.target)
})
test('real touch long-press opens without a synthetic click; movement, release and cancellation abort pending gestures', async () => {
  const selected = vi.fn(),
    { host } = await mount(
      <ContextMenu>
        <ContextMenuTrigger
          aria-label="Touch card"
          style={{ width: 300, height: 200 }}
        >
          <Button onClick={selected}>Visible action</Button>
        </ContextMenuTrigger>
        <ContextMenuPortal>
          <ContextMenuContent motion="off">
            <ContextMenuItem onSelect={selected}>Menu action</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenuPortal>
      </ContextMenu>
    ),
    p = parts(host)
  await act(async () => commands.contextTouch('[data-slot~="context-menu-trigger"]', 600, 'end'))
  expect(shown(p.panel)).toBe(true)
  expect(selected).not.toHaveBeenCalled()
  await click(p.panel.querySelector<HTMLButtonElement>('button')!)
  expect(selected).toHaveBeenCalledTimes(1)
  expect(shown(p.panel)).toBe(false)
  for (const ending of ['end', 'move', 'cancel'] as const) {
    await act(async () => commands.contextTouch('[data-slot~="context-menu-trigger"]', 80, ending))
    await pause(550)
    expect(shown(p.panel)).toBe(false)
  }
})
test('unmount cancels pending long-press and native refs preserve callback cleanup, styling and identities', async () => {
  const cleanup = vi.fn(),
    change = vi.fn(),
    ref = vi.fn(() => cleanup),
    panel = createRef<HTMLDivElement>(),
    { host, render } = await mount(
      <ThemeScope
        theme={defineTheme({
          id: 'context-test',
          name: 'Context test',
          components: { contextMenu: { width: '240px' } }
        })}
      >
        <ContextMenu onOpenChange={change}>
          <ContextMenuTrigger
            aria-label="Document"
            ref={ref}
            data-slot="document"
            title="Native target"
            style={{ width: 400, height: 200 }}
          />
          <ContextMenuPortal>
            <ContextMenuContent
              ref={panel}
              className="test-panel"
              motion="off"
            >
              <ContextMenuItem>Rename</ContextMenuItem>
            </ContextMenuContent>
          </ContextMenuPortal>
        </ContextMenu>
      </ThemeScope>
    ),
    p = parts(host)
  expect(p.target).toHaveAttribute('title', 'Native target')
  expect(p.target.dataset.slot).toBe('context-menu-trigger document')
  await context(p.target, 100, 100)
  expect(panel.current).toBe(p.panel)
  expect(p.panel.offsetWidth).toBe(240)
  expect(p.panel.dataset.slot).toBe('popover-content menu-content context-menu-content')
  await key('{Escape}')
  await act(async () =>
    p.target.dispatchEvent(
      new PointerEvent('pointerdown', {
        pointerType: 'touch',
        pointerId: 9,
        isPrimary: true,
        bubbles: true,
        clientX: 40,
        clientY: 40
      })
    )
  )
  await render(<div />)
  await pause(550)
  expect(change).toHaveBeenCalledTimes(2)
  expect(cleanup).toHaveBeenCalledTimes(1)
  expect(panel.current).toBe(null)
})
function Scope() {
  const state = useContextMenu()
  return <output>{state ? 'context' : 'none'}</output>
}
test('nested native dialog ancestry and independent menu scopes keep context ownership local', async () => {
  const { host } = await mount(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Files</DialogTitle>
          <Fixture />
          <Menu>
            <MenuTrigger>Independent</MenuTrigger>
            <MenuContent>
              <MenuItem>
                <Scope />
              </MenuItem>
            </MenuContent>
          </Menu>
        </DialogContent>
      </Dialog>
    ),
    p = parts(host)
  await context(p.target, 100, 120)
  expect(p.panel.closest('dialog')).toBe(host.querySelector('dialog'))
  expect(host.querySelector('dialog')!.matches(':modal')).toBe(true)
  await key('{Escape}')
  expect(host.querySelector('dialog')!.open).toBe(true)
  expect(host.querySelector('output')?.textContent).toBe('none')
  await commands.emulatePreferences({ forcedColors: 'active', reducedMotion: 'reduce' })
  await context(p.target, 100, 120)
  expect(shown(p.panel)).toBe(true)
  expect(getComputedStyle(p.panel).getPropertyValue('background-color')).not.toBe(
    'rgba(0, 0, 0, 0)'
  )
})

test('keyboard context placement follows the focused target inline start in RTL', async () => {
  const { host } = await mount(
      <ThemeScope
        style={{ width: 700 }}
        theme={defineTheme({
          id: 'context-rtl',
          name: 'Context RTL',
          components: { contextMenu: { width: '240px' } }
        })}
      >
        <Fixture dir="rtl" />
      </ThemeScope>
    ),
    p = parts(host),
    button = host.querySelector<HTMLButtonElement>('button')!
  await act(async () => button.focus())
  await key('{Shift>}{F10}{/Shift}')
  const anchor = button.getBoundingClientRect(),
    panel = p.panel.getBoundingClientRect()
  expect(panel.right).toBeCloseTo(anchor.right, 0)
  expect(panel.top).toBeCloseTo(anchor.bottom, 0)
  await key('{End}')
  await key('{ArrowLeft}')
  const submenu = host.querySelector<HTMLDivElement>('[data-slot~="context-menu-sub-content"]')!
  expect(shown(submenu)).toBe(true)
  expect(submenu.offsetWidth).toBe(240)
  expect(submenu.dataset.side).toBe('left')
  await key('{Escape}')
  await key('{Escape}')
  expect(document.activeElement).toBe(p.target)
})

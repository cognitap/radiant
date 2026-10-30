import { act, createRef, StrictMode, useId } from 'react'
import { expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import {
  Menu,
  MenuTrigger,
  MenuPortal,
  MenuContent,
  MenuItem,
  MenuGroup,
  MenuLabel,
  MenuSeparator,
  MenuCheckboxItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSub,
  MenuSubTrigger,
  MenuSubContent,
  ThemeScope,
  defineTheme,
  Button
} from '../../src/index.js'
import { mount, click, key, shown } from './familyHarness.js'
function Settings({
  changes,
  radioChanges
}: {
  changes: (next: boolean) => void
  radioChanges: (next: string | null) => void
}) {
  const id = useId()
  return (
    <Menu defaultOpen>
      <MenuTrigger>View settings</MenuTrigger>
      <MenuPortal>
        <MenuContent>
          <MenuGroup aria-labelledby={id}>
            <MenuLabel id={id}>Display</MenuLabel>
            <MenuCheckboxItem
              defaultChecked
              onCheckedChange={changes}
            >
              Grid lines
            </MenuCheckboxItem>
            <MenuCheckboxItem
              disabled
              onCheckedChange={changes}
            >
              Locked layout
            </MenuCheckboxItem>
          </MenuGroup>
          <MenuSeparator />
          <MenuRadioGroup
            aria-label="Layout"
            defaultValue="list"
            onValueChange={radioChanges}
          >
            <MenuRadioItem value="list">List</MenuRadioItem>
            <MenuRadioItem value="grid">Grid</MenuRadioItem>
          </MenuRadioGroup>
        </MenuContent>
      </MenuPortal>
    </Menu>
  )
}
test('group names, native checkable roles and typeahead retain checked state without closing the menu', async () => {
  const changed = vi.fn(),
    radioChanged = vi.fn(),
    { host } = await mount(
      <StrictMode>
        <Settings
          changes={changed}
          radioChanges={radioChanged}
        />
      </StrictMode>,
      true
    ),
    panel = host.querySelector<HTMLElement>('[role="menu"]')!,
    grid = panel.querySelector<HTMLButtonElement>('[role="menuitemcheckbox"]')!,
    locked = panel.querySelectorAll<HTMLButtonElement>('[role="menuitemcheckbox"]')[1],
    radios = Array.from(panel.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]'))
  const group = panel.querySelector('[role="group"]')!,
    label = panel.querySelector('[data-slot~="menu-label"]')!
  expect(group.getAttribute('aria-labelledby')).toBe(label.id)
  expect(panel.querySelector('hr')).toHaveAttribute('data-slot', 'separator menu-separator')
  expect(grid.dataset.slot).toBe('button popover-close menu-item menu-checkbox-item')
  expect(grid).toHaveAttribute('aria-checked', 'true')
  expect(radios[0]).toHaveAttribute('aria-checked', 'true')
  await key(' ')
  expect(changed).toHaveBeenCalledExactlyOnceWith(false)
  expect(grid).toHaveAttribute('aria-checked', 'false')
  expect(shown(panel)).toBe(true)
  await key('{ArrowDown}')
  expect(locked).toHaveFocus()
  await key('{Enter}')
  expect(changed).toHaveBeenCalledTimes(1)
  await click(radios[1])
  expect(radioChanged).toHaveBeenCalledExactlyOnceWith('grid')
  expect(radios[1]).toHaveAttribute('aria-checked', 'true')
  expect(radios[0]).toHaveAttribute('aria-checked', 'false')
  expect(shown(panel)).toBe(true)
  await key('g')
  expect(grid).toHaveFocus()
  await key('g')
  expect(radios[1]).toHaveFocus()
  await key('{Escape}')
  expect(shown(panel)).toBe(false)
})
test('mixed and controlled checkable requests honor cancellation, pending guards and one close request', async () => {
  const checked = vi.fn(),
    close = vi.fn(),
    cancel = vi.fn((event: { preventDefault(): void }) => event.preventDefault())
  const { host, render } = await mount(
    <Menu
      open
      onOpenChange={close}
    >
      <MenuTrigger>Preferences</MenuTrigger>
      <MenuContent>
        <MenuCheckboxItem
          checked={false}
          indeterminate
          onCheckedChange={checked}
          closeOnSelect
        >
          All layers
        </MenuCheckboxItem>
        <MenuCheckboxItem
          defaultChecked
          onCheckedChange={checked}
          onSelect={cancel}
        >
          Cancel change
        </MenuCheckboxItem>
        <MenuCheckboxItem
          pending
          onCheckedChange={checked}
        >
          Syncing preference
        </MenuCheckboxItem>
      </MenuContent>
    </Menu>
  )
  const panel = host.querySelector<HTMLElement>('[role="menu"]')!,
    buttons = Array.from(panel.querySelectorAll<HTMLButtonElement>('[role="menuitemcheckbox"]'))
  expect(buttons[0]).toHaveAttribute('aria-checked', 'mixed')
  await click(buttons[0])
  expect(checked).toHaveBeenCalledExactlyOnceWith(true)
  expect(close).toHaveBeenCalledExactlyOnceWith(false)
  expect(buttons[0]).toHaveAttribute('aria-checked', 'mixed')
  expect(shown(panel)).toBe(true)
  checked.mockClear()
  close.mockClear()
  await click(buttons[1])
  expect(cancel).toHaveBeenCalledOnce()
  expect(checked).not.toHaveBeenCalled()
  expect(close).not.toHaveBeenCalled()
  await click(buttons[2])
  expect(checked).not.toHaveBeenCalled()
  expect(close).not.toHaveBeenCalled()
  await render(
    <Menu
      open={false}
      onOpenChange={close}
    >
      <MenuTrigger>Preferences</MenuTrigger>
      <MenuContent>
        <MenuCheckboxItem
          checked
          onCheckedChange={checked}
        >
          Updated preference
        </MenuCheckboxItem>
      </MenuContent>
    </Menu>
  )
  expect(checked).not.toHaveBeenCalled()
  expect(close).not.toHaveBeenCalled()
})
function Nested({
  rtl = false,
  onAction,
  defaultOpen = true,
  ...props
}: {
  rtl?: boolean
  onAction: () => void
  defaultOpen?: boolean
}) {
  return (
    <div
      dir={rtl ? 'rtl' : 'ltr'}
      style={{ position: 'fixed', left: 600, top: 80 }}
    >
      <Menu
        {...props}
        defaultOpen={defaultOpen}
      >
        <MenuTrigger>File actions</MenuTrigger>
        <MenuPortal>
          <MenuContent>
            <MenuItem>Rename</MenuItem>
            <MenuSub>
              <MenuSubTrigger>Export</MenuSubTrigger>
              <MenuPortal>
                <MenuSubContent>
                  <MenuItem onSelect={onAction}>PDF</MenuItem>
                  <MenuSub>
                    <MenuSubTrigger>Share</MenuSubTrigger>
                    <MenuPortal>
                      <MenuSubContent>
                        <MenuItem onSelect={onAction}>Copy link</MenuItem>
                      </MenuSubContent>
                    </MenuPortal>
                  </MenuSub>
                </MenuSubContent>
              </MenuPortal>
            </MenuSub>
            <MenuItem>Archive</MenuItem>
          </MenuContent>
        </MenuPortal>
      </Menu>
      <Button>After menus</Button>
    </div>
  )
}
for (const rtl of [false, true])
  test(`submenus preserve independent keyboard scopes and close the whole command tree (${rtl ? 'RTL' : 'LTR'})`, async () => {
    const action = vi.fn(),
      { host } = await mount(
        <Nested
          rtl={rtl}
          onAction={action}
        />
      ),
      panels = Array.from(host.querySelectorAll<HTMLElement>('[role="menu"]')),
      trigger = host.querySelector<HTMLButtonElement>('[data-slot~="menu-sub-trigger"]')!,
      rootTrigger = host.querySelector<HTMLButtonElement>('[data-slot~="menu-trigger"]')!
    expect(trigger.nextElementSibling).toBe(panels[1])
    await act(async () => trigger.focus())
    await key(rtl ? '{ArrowLeft}' : '{ArrowRight}')
    expect(shown(panels[1])).toBe(true)
    expect(panels[1].querySelector('button')).toHaveFocus()
    expect(panels[1].dataset.side).toBe(rtl ? 'left' : 'right')
    await key(rtl ? '{ArrowRight}' : '{ArrowLeft}')
    expect(shown(panels[1])).toBe(false)
    expect(trigger).toHaveFocus()
    expect(shown(panels[0])).toBe(true)
    await key(rtl ? '{ArrowLeft}' : '{ArrowRight}')
    const inner = panels[1].querySelector<HTMLButtonElement>('[data-slot~="menu-sub-trigger"]')!
    await act(async () => inner.focus())
    await key(rtl ? '{ArrowLeft}' : '{ArrowRight}')
    expect(shown(panels[2])).toBe(true)
    await key('{Escape}')
    expect(shown(panels[2])).toBe(false)
    expect(inner).toHaveFocus()
    expect(shown(panels[1])).toBe(true)
    await act(async () => panels[1].querySelector<HTMLButtonElement>('[role="menuitem"]')!.focus())
    await key('{Enter}')
    expect(action).toHaveBeenCalledOnce()
    expect(panels.every(panel => !shown(panel))).toBe(true)
    expect(rootTrigger).toHaveFocus()
  })
test('pointer submenu opening retains parent focus, live direction updates placement, and Tab leaves the full tree', async () => {
  const { host } = await mount(<Nested onAction={() => {}} />),
    parent = host.querySelector<HTMLElement>('[role="menu"]')!,
    subTrigger = host.querySelector<HTMLButtonElement>('[data-slot~="menu-sub-trigger"]')!,
    child = host.querySelector<HTMLElement>('[data-slot~="menu-sub-content"]')!
  await act(async () => userEvent.hover(subTrigger))
  expect(shown(child)).toBe(true)
  expect(subTrigger).toHaveFocus()
  expect(child.dataset.side).toBe('right')
  await act(async () => host.firstElementChild!.setAttribute('dir', 'rtl'))
  await expect.poll(() => child.dataset.side).toBe('left')
  await key('{ArrowLeft}')
  expect(child.querySelector('button')).toHaveFocus()
  await key('{Tab}')
  expect(shown(parent)).toBe(false)
  expect(shown(child)).toBe(false)
  expect(Array.from(host.querySelectorAll(':scope > div > button')).at(-1)).toHaveFocus()
})
test('checkable and group parts forward native refs/styles, preserve forced-colors state and clean callback refs', async () => {
  const button = createRef<HTMLButtonElement>(),
    group = createRef<HTMLDivElement>(),
    label = createRef<HTMLDivElement>(),
    content = createRef<HTMLDivElement>(),
    cleanup = vi.fn(),
    theme = defineTheme({
      id: 'menu-checks',
      name: 'Menu checks',
      components: { menu: { itemPadding: '9px', itemRadius: '7px' } }
    })
  const { host, render } = await mount(
    <ThemeScope theme={theme}>
      <Menu defaultOpen>
        <MenuTrigger>Settings</MenuTrigger>
        <MenuContent ref={content}>
          <MenuGroup
            ref={group}
            aria-label="Grid options"
            className="gap-2"
          >
            <MenuLabel ref={label}>Canvas</MenuLabel>
            <MenuCheckboxItem
              ref={node => {
                button.current = node
                return cleanup
              }}
              defaultChecked
              className="rounded-none"
              style={{ borderWidth: '2px' }}
              parts={{ indicator: { className: 'w-7', style: { color: 'rebeccapurple' } } }}
            >
              Grid
            </MenuCheckboxItem>
          </MenuGroup>
        </MenuContent>
      </Menu>
    </ThemeScope>
  )
  expect(group.current).toBe(host.querySelector('[data-slot~="menu-group"]'))
  expect(label.current).toBe(host.querySelector('[data-slot~="menu-label"]'))
  expect(button.current).toBeInstanceOf(HTMLButtonElement)
  expect(getComputedStyle(button.current!).padding).toBe('9px')
  expect(getComputedStyle(button.current!).borderTopLeftRadius).toBe('0px')
  expect(getComputedStyle(group.current!).gap).toBe('8px')
  expect(
    getComputedStyle(button.current!.querySelector('[data-slot~="menu-item-indicator"]')!).width
  ).toBe('28px')
  await commands.emulatePreferences({ forcedColors: 'active', reducedMotion: 'reduce' })
  expect(button.current).toHaveAttribute('aria-checked', 'true')
  expect(button.current!.querySelector('[data-slot~="menu-item-indicator"]')).toHaveAttribute(
    'aria-hidden',
    'true'
  )
  await render(null)
  expect(cleanup).toHaveBeenCalled()
  expect(content.current).toBeNull()
})

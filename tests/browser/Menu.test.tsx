import { act, createRef, StrictMode } from 'react'
import { expect, test, vi } from 'vitest'
import { commands } from 'vitest/browser'
import {
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  MenuPortal,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  ThemeScope,
  defineTheme,
  type MenuProps
} from '../../src/index.js'
import { MotionProvider } from '../../src/motion/react.js'
import { mount, click, key, shown } from './familyHarness.js'
function Fixture({ children, ...props }: MenuProps) {
  return (
    <Menu {...props}>
      <MenuTrigger>Commands</MenuTrigger>
      <MenuPortal>
        <MenuContent>
          {children ?? (
            <>
              <MenuItem>Alpha</MenuItem>
              <MenuItem disabled>Archive</MenuItem>
              <MenuItem>Beta</MenuItem>
              <MenuItem>Bravo</MenuItem>
            </>
          )}
        </MenuContent>
      </MenuPortal>
    </Menu>
  )
}
function parts(host: HTMLElement) {
  return {
    trigger: host.querySelector<HTMLButtonElement>('[data-slot~=menu-trigger]')!,
    panel: host.querySelector<HTMLElement>('[role=menu]')!,
    options: Array.from(host.querySelectorAll<HTMLButtonElement>('[role=menuitem]'))
  }
}
test('hydrates, enters first/last, wraps and typeaheads through discoverable disabled commands', async () => {
  const { host } = await mount(
    <StrictMode>
      <Fixture />
    </StrictMode>,
    true
  )
  const p = parts(host)
  expect(p.trigger.getAttribute('aria-controls')).toBe(p.panel.id)
  expect(p.panel.getAttribute('aria-labelledby')).toBe(p.trigger.id)
  await act(async () => p.trigger.focus())
  await key('{ArrowUp}')
  expect(document.activeElement).toBe(p.options[3])
  await key('{ArrowDown}')
  expect(document.activeElement).toBe(p.options[0])
  await key('{ArrowDown}')
  expect(document.activeElement).toBe(p.options[1])
  await key('{Enter}')
  expect(shown(p.panel)).toBe(true)
  await key('{End}')
  expect(document.activeElement).toBe(p.options[3])
  await key('{Home}')
  await key('b')
  expect(document.activeElement).toBe(p.options[2])
  await key('b')
  expect(document.activeElement).toBe(p.options[3])
  await key('{Escape}')
  expect(shown(p.panel)).toBe(false)
  expect(document.activeElement).toBe(p.trigger)
  await key('{Enter}')
  expect(document.activeElement).toBe(p.options[0])
})
test('Tab and Shift+Tab leave the command set without trapping or visiting each item', async () => {
  const { host } = await mount(
    <>
      <button>Before</button>
      <Fixture />
      <button>After</button>
    </>
  )
  const p = parts(host)
  await click(p.trigger)
  await key('{Tab}')
  expect(shown(p.panel)).toBe(false)
  expect(document.activeElement?.textContent).toBe('After')
  await click(p.trigger)
  await key('{Shift>}{Tab}{/Shift}')
  expect(shown(p.panel)).toBe(false)
  expect(document.activeElement?.textContent).toBe('Before')
})
test('guards disabled and pending, permits cancellation and preserves native form activation', async () => {
  const action = vi.fn()
  const blocked = vi.fn()
  const submit = vi.fn()
  const { host } = await mount(
    <form
      onSubmit={event => {
        event.preventDefault()
        submit()
      }}
    >
      <Fixture>
        <MenuItem
          disabled
          onClick={blocked}
          onSelect={blocked}
        >
          Disabled
        </MenuItem>
        <MenuItem
          pending
          onClick={blocked}
        >
          Pending
        </MenuItem>
        <MenuItem onSelect={event => event.preventDefault()}>Keep open</MenuItem>
        <MenuItem
          type="submit"
          name="command"
          value="save"
          onSelect={action}
        >
          Save
        </MenuItem>
      </Fixture>
    </form>
  )
  const p = parts(host)
  await click(p.trigger)
  await act(async () => p.options[0].click())
  await click(p.options[1])
  await click(p.options[2])
  expect(blocked).not.toHaveBeenCalled()
  expect(shown(p.panel)).toBe(true)
  await click(p.options[3])
  expect(action).toHaveBeenCalledTimes(1)
  expect(submit).toHaveBeenCalledTimes(1)
  expect(shown(p.panel)).toBe(false)
  expect(document.activeElement).toBe(p.trigger)
})
test('controlled owners may refuse requests; prop sync is silent', async () => {
  const change = vi.fn()
  const tree = (open: boolean) => (
    <Fixture
      open={open}
      onOpenChange={change}
    />
  )
  const { host, render } = await mount(tree(false))
  const p = parts(host)
  await click(p.trigger)
  expect(change).toHaveBeenLastCalledWith(true)
  expect(shown(p.panel)).toBe(false)
  change.mockClear()
  await render(tree(true))
  expect(change).not.toHaveBeenCalled()
  await key('{Escape}')
  expect(change).toHaveBeenLastCalledWith(false)
  expect(shown(p.panel)).toBe(true)
})
test('Escape dismisses Menu before its containing Popover and Dialog', async () => {
  const { host } = await mount(
    <Dialog>
      <DialogTrigger>Settings</DialogTrigger>
      <DialogContent>
        <DialogTitle>Settings</DialogTitle>
        <Popover>
          <PopoverTrigger>Tools</PopoverTrigger>
          <PopoverContent>
            <Fixture />
          </PopoverContent>
        </Popover>
      </DialogContent>
    </Dialog>
  )
  await click(host.querySelector('button')!)
  await click(host.querySelector<HTMLButtonElement>('[data-slot~=popover-trigger]')!)
  const outer = host.querySelector<HTMLElement>('[data-slot~=popover-content]')!
  const p = parts(host)
  await click(p.trigger)
  await key('{Escape}')
  expect(shown(p.panel)).toBe(false)
  expect(shown(outer)).toBe(true)
  expect(host.querySelector('dialog')!.open).toBe(true)
  await key('{Escape}')
  expect(shown(outer)).toBe(false)
  expect(host.querySelector('dialog')!.open).toBe(true)
})
test('outside pointer dismissal preserves its target; touch activates exactly once', async () => {
  const action = vi.fn()
  const { host } = await mount(
    <>
      <Fixture>
        <MenuItem onSelect={action}>Save</MenuItem>
      </Fixture>
      <input aria-label="Outside" />
    </>
  )
  const p = parts(host)
  await click(p.trigger)
  await click(host.querySelector('input')!)
  expect(shown(p.panel)).toBe(false)
  expect(document.activeElement).toBe(host.querySelector('input'))
  await act(async () => commands.touchButton('[data-slot~=menu-trigger]', false))
  expect(shown(p.panel)).toBe(true)
  await act(async () => commands.touchButton('[data-slot~=menu-item]', false))
  expect(action).toHaveBeenCalledTimes(1)
  expect(shown(p.panel)).toBe(false)
})
test('surface styles/ref, reduced motion and forced colors retain command semantics', async () => {
  const ref = createRef<HTMLDivElement>()
  const theme = defineTheme({
    id: 'menu-proof',
    name: 'Menu proof',
    components: { menu: { width: '240px', padding: '12px', itemRadius: '13px' } }
  })
  const { host } = await mount(
    <ThemeScope
      theme={theme}
      mode="dark"
    >
      <MotionProvider>
        <Menu>
          <MenuTrigger>Open</MenuTrigger>
          <MenuContent
            ref={ref}
            motion="off"
          >
            <MenuItem render={props => <button {...props} />}>Save</MenuItem>
          </MenuContent>
        </Menu>
      </MotionProvider>
    </ThemeScope>
  )
  const p = parts(host)
  await act(async () => p.trigger.focus())
  await key('{ArrowDown}')
  expect(ref.current).toBe(p.panel)
  expect(getComputedStyle(p.panel).width).toBe('240px')
  expect(getComputedStyle(p.panel).padding).toBe('12px')
  expect(getComputedStyle(p.options[0]).borderRadius).toBe('13px')
  expect(getComputedStyle(p.options[0]).borderTopWidth).toBe('0px')
  await commands.emulatePreferences({ reducedMotion: 'reduce', forcedColors: 'active' })
  expect(getComputedStyle(p.options[0]).outlineStyle).not.toBe('none')
  expect(getComputedStyle(p.panel).display).not.toBe('none')
})
test('unmount removes the open layer and its listeners; an empty menu stays dismissible', async () => {
  const change = vi.fn()
  const { host, render } = await mount(<Fixture onOpenChange={change}>{[]}</Fixture>)
  const p = parts(host)
  await click(p.trigger)
  expect(document.activeElement).toBe(p.panel)
  await key('{Escape}')
  expect(shown(p.panel)).toBe(false)
  await click(p.trigger)
  change.mockClear()
  await render(null)
  await key('{Escape}')
  expect(change).not.toHaveBeenCalled()
})

import { act, createRef, StrictMode, useState, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  ThemeScope,
  defineTheme,
  useTabs
} from '../../src/index.js'
import { TabsWorkspaceExample } from '../../.storybook/examples/TabsExamples.js'
import '../../.storybook/styles.css'

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const mounted: { host: HTMLDivElement; root: Root }[] = []
async function mount(tree: ReactNode, hydrate = false) {
  const host = document.createElement('div')
  document.body.append(host)
  if (hydrate) host.innerHTML = renderToString(tree)
  const errors: unknown[] = []
  let root!: Root
  await act(async () => {
    root = hydrate
      ? hydrateRoot(host, tree, { onRecoverableError: error => errors.push(error) })
      : createRoot(host)
    if (!hydrate) root.render(tree)
  })
  mounted.push({ host, root })
  expect(errors).toEqual([])
  return { host, render: (tree: ReactNode) => act(async () => root.render(tree)) }
}
afterEach(async () => {
  for (const { host, root } of mounted.splice(0)) {
    await act(async () => root.unmount())
    host.remove()
  }
  await commands.emulatePreferences({ forcedColors: 'none', reducedMotion: 'no-preference' })
})

type FixtureProps = {
  mode?: 'automatic' | 'manual'
  dir?: 'ltr' | 'rtl'
  orientation?: 'horizontal' | 'vertical'
  loop?: boolean
  disabled?: boolean
  onValueChange?: (value: string) => void
}
function Fixture({ mode = 'automatic', ...props }: FixtureProps) {
  return (
    <Tabs
      defaultValue="one"
      activationMode={mode}
      {...props}
    >
      <TabsList aria-label="Sections">
        <TabsTrigger value="one">One</TabsTrigger>
        <TabsTrigger
          value="two"
          disabled
        >
          Two
        </TabsTrigger>
        <TabsTrigger value="three">Three</TabsTrigger>
        <TabsTrigger value="four">Four</TabsTrigger>
      </TabsList>
      <TabsContent value="one">First panel</TabsContent>
      <TabsContent value="two">Unavailable panel</TabsContent>
      <TabsContent value="three">Third panel</TabsContent>
      <TabsContent value="four">Fourth panel</TabsContent>
    </Tabs>
  )
}
function parts(host: HTMLElement) {
  return {
    tabs: Array.from(host.querySelectorAll<HTMLButtonElement>('[role=tab]')),
    panels: Array.from(host.querySelectorAll<HTMLDivElement>('[role=tabpanel]')),
    list: host.querySelector<HTMLDivElement>('[role=tablist]')!
  }
}

test('StrictMode hydration preserves named tab/panel IDs, initial selection and one Tab entry per owner', async () => {
  const { host } = await mount(
    <StrictMode>
      <Fixture />
      <Fixture />
    </StrictMode>,
    true
  )
  const lists = host.querySelectorAll('[role=tablist]')
  expect(lists).toHaveLength(2)
  const ids = Array.from(host.querySelectorAll('[id]'), element => element.id)
  expect(new Set(ids).size).toBe(ids.length)
  for (const list of lists) {
    const tabs = Array.from(list.querySelectorAll<HTMLButtonElement>('[role=tab]'))
    expect(tabs.filter(tab => tab.tabIndex === 0)).toEqual([tabs[0]])
    for (const [index, tab] of tabs.entries()) {
      const panel = host.ownerDocument.getElementById(tab.getAttribute('aria-controls')!)!
      expect(tab.type).toBe('button')
      expect(tab.dataset.slot).toBe('button tabs-trigger')
      expect(tab.getAttribute('aria-selected')).toBe(String(index === 0))
      expect(panel.getAttribute('aria-labelledby')).toBe(tab.id)
      expect(panel.hidden).toBe(index !== 0)
      if (index !== 0) expect(panel.textContent).toBe('')
    }
  }
})

for (const dir of ['ltr', 'rtl'] as const) {
  test(`${dir}: automatic focus skips disabled tabs, wraps, and supports Home/End without duplicate callbacks`, async () => {
    const change = vi.fn()
    const { host } = await mount(
      <Fixture
        dir={dir}
        onValueChange={change}
      />
    )
    const { tabs, list } = parts(host)
    const forward = dir === 'ltr' ? '{ArrowRight}' : '{ArrowLeft}'
    await act(async () => {
      tabs[0].focus()
      await userEvent.keyboard(forward)
    })
    expect(document.activeElement).toBe(tabs[2])
    expect(tabs[2].getAttribute('aria-selected')).toBe('true')
    expect(change).toHaveBeenLastCalledWith('three')
    await act(async () => {
      await userEvent.keyboard('{End}' + forward)
    })
    expect(document.activeElement).toBe(tabs[0])
    expect(change).toHaveBeenCalledTimes(3)
    await act(async () => {
      await userEvent.keyboard('{End}{Home}{Enter}')
    })
    expect(change).toHaveBeenCalledTimes(5)
    expect(tabs.filter(tab => tab.tabIndex === 0)).toEqual([tabs[0]])
    const up = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true })
    await act(async () => tabs[0].dispatchEvent(up))
    expect(up.defaultPrevented).toBe(false)
    expect(list.getAttribute('aria-orientation')).toBe('horizontal')
  })
}

test('manual arrows move only focus; Enter/Space activate; Tab leaves the list and returns to the selected tab', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <>
      <Fixture
        mode="manual"
        onValueChange={change}
      />
      <button>After</button>
    </>
  )
  const { tabs, panels } = parts(host)
  await act(async () => {
    tabs[0].focus()
    await userEvent.keyboard('{ArrowRight}')
  })
  expect(document.activeElement).toBe(tabs[2])
  expect(tabs[0].getAttribute('aria-selected')).toBe('true')
  expect(change).not.toHaveBeenCalled()
  expect(tabs.filter(tab => tab.tabIndex === 0)).toEqual([tabs[2]])
  await act(async () => {
    await userEvent.tab()
  })
  expect(document.activeElement).toBe(panels[0])
  expect(tabs[0].tabIndex).toBe(0)
  await act(async () => {
    await userEvent.tab({ shift: true })
    await userEvent.keyboard('{End}{Enter}')
  })
  expect(tabs[3].getAttribute('aria-selected')).toBe('true')
  expect(change).toHaveBeenCalledTimes(1)
  await act(async () => {
    await userEvent.keyboard('{Home} ')
  })
  expect(tabs[0].getAttribute('aria-selected')).toBe('true')
  expect(change).toHaveBeenCalledTimes(2)
})

test('vertical navigation uses Up/Down and non-looping lists stop at the ends', async () => {
  const { host } = await mount(
    <Fixture
      orientation="vertical"
      loop={false}
    />
  )
  const { tabs, list } = parts(host)
  await act(async () => {
    tabs[0].focus()
    await userEvent.keyboard('{ArrowUp}')
  })
  expect(document.activeElement).toBe(tabs[0])
  await act(async () => {
    await userEvent.keyboard('{ArrowDown}{End}{ArrowDown}')
  })
  expect(document.activeElement).toBe(tabs[3])
  expect(list.getAttribute('aria-orientation')).toBe('vertical')
  const right = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
  await act(async () => tabs[3].dispatchEvent(right))
  expect(right.defaultPrevented).toBe(false)
})

test('controlled requests can be refused; prop sync does not request changes or steal panel focus', async () => {
  const change = vi.fn()
  function Controlled({ value }: { value: string }) {
    return (
      <Tabs
        value={value}
        onValueChange={change}
      >
        <TabsList aria-label="Settings">
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="one">
          <input aria-label="Draft" />
        </TabsContent>
        <TabsContent value="two">Second panel</TabsContent>
      </Tabs>
    )
  }
  const view = await mount(<Controlled value="one" />)
  const { tabs, panels } = parts(view.host)
  await act(async () => {
    await userEvent.click(tabs[1])
  })
  expect(change).toHaveBeenCalledExactlyOnceWith('two')
  expect(tabs[0].getAttribute('aria-selected')).toBe('true')
  expect(panels[0].hidden).toBe(false)
  await act(async () => tabs[0].focus())
  await view.render(<Controlled value="two" />)
  expect(document.activeElement).toBe(tabs[0])
  expect(tabs[1].getAttribute('aria-selected')).toBe('true')
  expect(change).toHaveBeenCalledTimes(1)
})

test('consumer click, focus and keyboard cancellation prevent the corresponding selection request', async () => {
  const change = vi.fn(),
    click = vi.fn()
  const { host } = await mount(
    <Tabs
      defaultValue="one"
      onValueChange={change}
    >
      <TabsList
        aria-label="Settings"
        onKeyDown={e => e.preventDefault()}
      >
        <TabsTrigger value="one">One</TabsTrigger>
        <TabsTrigger
          value="two"
          onClick={e => {
            click()
            e.preventDefault()
          }}
          onFocus={e => e.preventDefault()}
        >
          Two
        </TabsTrigger>
      </TabsList>
      <TabsContent value="one">First</TabsContent>
      <TabsContent value="two">Second</TabsContent>
    </Tabs>
  )
  const { tabs } = parts(host)
  await act(async () => {
    await userEvent.click(tabs[1])
  })
  expect(click).toHaveBeenCalledOnce()
  expect(change).not.toHaveBeenCalled()
  await act(async () => {
    tabs[0].focus()
    await userEvent.keyboard('{ArrowRight}')
  })
  expect(document.activeElement).toBe(tabs[0])
  expect(change).not.toHaveBeenCalled()
})

test('automatic pointer activation waits for click so its consumer can cancel independently of focus', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <Tabs
      defaultValue="one"
      onValueChange={change}
    >
      <TabsList aria-label="Settings">
        <TabsTrigger value="one">One</TabsTrigger>
        <TabsTrigger
          value="two"
          onClick={e => e.preventDefault()}
        >
          Two
        </TabsTrigger>
      </TabsList>
      <TabsContent value="one">First</TabsContent>
      <TabsContent value="two">Second</TabsContent>
    </Tabs>
  )
  await act(async () => {
    await userEvent.click(parts(host).tabs[1])
  })
  expect(change).not.toHaveBeenCalled()
  expect(parts(host).tabs[0].getAttribute('aria-selected')).toBe('true')
})

test('disabled owners guard trigger and useTabs requests; native fieldset disabling restores its entry on re-enable', async () => {
  const change = vi.fn()
  function Request() {
    const tabs = useTabs()
    return <button onClick={() => tabs?.setValue('two')}>Request</button>
  }
  const view = await mount(
    <fieldset disabled>
      <Tabs
        defaultValue="one"
        onValueChange={change}
      >
        <TabsList aria-label="Settings">
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="one">First</TabsContent>
        <TabsContent value="two">Second</TabsContent>
      </Tabs>
    </fieldset>
  )
  const { tabs } = parts(view.host)
  expect(tabs[0].matches(':disabled')).toBe(true)
  await act(async () => {
    view.host.querySelector('fieldset')!.disabled = false
    await userEvent.tab()
  })
  expect(document.activeElement).toBe(tabs[0])
  await view.render(
    <Tabs
      defaultValue="one"
      disabled
      onValueChange={change}
    >
      <TabsList aria-label="Settings">
        <TabsTrigger value="one">One</TabsTrigger>
        <TabsTrigger value="two">Two</TabsTrigger>
      </TabsList>
      <TabsContent value="one">First</TabsContent>
      <TabsContent value="two">Second</TabsContent>
      <Request />
    </Tabs>
  )
  await act(async () => {
    parts(view.host).tabs[1].click()
    await userEvent.click(view.host.querySelector('button:not([role])')!)
  })
  expect(change).not.toHaveBeenCalled()
  expect(parts(view.host).tabs.every(tab => tab.disabled && tab.tabIndex === -1)).toBe(true)
})

for (const keepMounted of [false, true]) {
  test(`${keepMounted ? 'kept' : 'unmounted'} inactive panel children obey lifecycle and stay hidden/inert`, async () => {
    function Counter() {
      const [count, setCount] = useState(0)
      return <button onClick={() => setCount(count + 1)}>Count {count}</button>
    }
    const { host } = await mount(
      <Tabs defaultValue="one">
        <TabsList aria-label="Settings">
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsContent
          value="one"
          keepMounted={keepMounted}
          style={{ display: 'flex' }}
        >
          <Counter />
        </TabsContent>
        <TabsContent value="two">Second</TabsContent>
      </Tabs>
    )
    const { tabs, panels } = parts(host)
    await act(async () => {
      await userEvent.click(panels[0].querySelector('button')!)
      await userEvent.click(tabs[1])
    })
    expect(panels[0].hidden).toBe(true)
    expect(panels[0].inert).toBe(true)
    expect(getComputedStyle(panels[0]).display).toBe('none')
    expect(panels[0].querySelector('button') !== null).toBe(keepMounted)
    await act(async () => {
      await userEvent.click(tabs[0])
    })
    expect(panels[0].querySelector('button')!.textContent).toBe(`Count ${keepMounted ? 1 : 0}`)
    expect(getComputedStyle(panels[0]).display).toBe('flex')
  })
}

test('nested tabs keep focus and requests inside the nearest list', async () => {
  const outer = vi.fn(),
    inner = vi.fn()
  const { host } = await mount(
    <Tabs
      defaultValue="one"
      onValueChange={outer}
    >
      <TabsList aria-label="Outer">
        <TabsTrigger value="one">Outer one</TabsTrigger>
        <TabsTrigger value="two">Outer two</TabsTrigger>
      </TabsList>
      <TabsContent value="one">
        <Fixture onValueChange={inner} />
      </TabsContent>
      <TabsContent value="two">Other</TabsContent>
    </Tabs>
  )
  const lists = host.querySelectorAll('[role=tablist]')
  const inside = lists[1].querySelectorAll<HTMLButtonElement>('[role=tab]')
  await act(async () => {
    inside[0].focus()
    await userEvent.keyboard('{ArrowRight}')
  })
  expect(inner).toHaveBeenCalledExactlyOnceWith('three')
  expect(outer).not.toHaveBeenCalled()
  expect(document.activeElement).toBe(inside[2])
})

test('navigation reads live DOM order and disabled/hidden tabs without leaving the widget unreachable', async () => {
  function Ordered({ values }: { values: string[] }) {
    return (
      <Tabs defaultValue="a">
        <TabsList aria-label="Ordered">
          {values.map(value => (
            <TabsTrigger
              key={value}
              value={value}
              style={value === 'hidden' ? { display: 'none' } : undefined}
            >
              {value}
            </TabsTrigger>
          ))}
        </TabsList>
        {values.map(value => (
          <TabsContent
            key={value}
            value={value}
          >
            {value}
          </TabsContent>
        ))}
      </Tabs>
    )
  }
  const view = await mount(<Ordered values={['a', 'b', 'c', 'hidden']} />)
  await view.render(<Ordered values={['c', 'a', 'hidden', 'b']} />)
  const { tabs } = parts(view.host)
  await act(async () => {
    tabs[1].focus()
    await userEvent.keyboard('{ArrowRight}')
  })
  expect(document.activeElement).toBe(tabs[3])
  await act(async () => {
    tabs[3].disabled = true
  })
  await expect
    .poll(() => parts(view.host).tabs.filter(tab => tab.tabIndex === 0 && !tab.disabled).length)
    .toBe(1)
})

test('ref/render/native events reach the button; Tabs styling is independent of Button overrides', async () => {
  const trigger = createRef<HTMLButtonElement>(),
    list = createRef<HTMLDivElement>(),
    panel = createRef<HTMLDivElement>(),
    root = createRef<HTMLDivElement>(),
    click = vi.fn()
  const theme = defineTheme({
    id: 'tabs-only',
    name: 'Tabs',
    components: {
      button: { height: '90px', fontFamily: 'monospace', fontSize: '32px', shadow: '0 0 20px red' },
      tabs: { triggerHeight: '44px', fontSize: '16px', contentPadding: '20px' }
    }
  })
  const { host } = await mount(
    <ThemeScope theme={theme}>
      <Tabs
        defaultValue="one"
        ref={root}
      >
        <TabsList
          ref={list}
          aria-label="Sections"
        >
          <TabsTrigger
            value="one"
            ref={trigger}
            onClick={click}
            render={resolved => (
              <button
                {...resolved}
                data-custom="yes"
              />
            )}
          >
            One
          </TabsTrigger>
        </TabsList>
        <TabsContent
          value="one"
          ref={panel}
        >
          Panel
        </TabsContent>
      </Tabs>
    </ThemeScope>
  )
  expect(root.current).toBe(host.querySelector('[data-slot~=tabs]'))
  expect(list.current).toBe(parts(host).list)
  expect(panel.current).toBe(parts(host).panels[0])
  expect(trigger.current?.tagName).toBe('BUTTON')
  expect(trigger.current?.dataset.custom).toBe('yes')
  expect(getComputedStyle(trigger.current!).minHeight).toBe('44px')
  expect(getComputedStyle(trigger.current!).fontSize).toBe('16px')
  expect(getComputedStyle(trigger.current!).boxShadow).toBe('none')
  await act(async () => {
    await userEvent.click(trigger.current!)
  })
  expect(click).toHaveBeenCalledOnce()
})

test('forced colors and reduced motion preserve selected/focus cues and keyboard operation', async () => {
  const { host } = await mount(<Fixture />)
  const { tabs } = parts(host)
  await commands.emulatePreferences({ forcedColors: 'active', reducedMotion: 'reduce' })
  await act(async () => {
    tabs[0].focus()
    await userEvent.keyboard('{ArrowRight}')
  })
  expect(tabs[2].getAttribute('aria-selected')).toBe('true')
  expect(getComputedStyle(tabs[2]).outlineStyle).not.toBe('none')
  expect(getComputedStyle(tabs[2]).borderTopColor).not.toBe('rgba(0, 0, 0, 0)')
})

test('workspace settings retain hidden fields, submit once and leave selection unchanged on form reset', async () => {
  const { host } = await mount(<TabsWorkspaceExample />)
  const { tabs } = parts(host)
  const name = host.querySelector<HTMLInputElement>('input[name=workspace]')!
  await act(async () => {
    await userEvent.fill(name, 'Atelier')
    await userEvent.click(tabs[1])
  })
  expect(host.querySelector('output')!.textContent).toBe('No changes saved')
  await act(async () => {
    await userEvent.click(host.querySelector('input[name=desktop]')!)
    await userEvent.click(host.querySelector('button[type=submit]')!)
  })
  expect(host.querySelector('output')!.textContent).toBe(
    'Saved locally: Atelier; desktop notifications off.'
  )
  await act(async () => {
    await userEvent.click(host.querySelector('button[type=reset]')!)
  })
  expect(tabs[1].getAttribute('aria-selected')).toBe('true')
  expect(name.value).toBe('Studio')
  expect(host.querySelector<HTMLInputElement>('input[name=desktop]')!.checked).toBe(true)
})

for (const controlSize of ['small', 'medium', 'large'] as const) {
  test(`${controlSize}: shared dimensions and a narrow list keep the active tab reachable`, async () => {
    const { host } = await mount(
      <div style={{ width: 180 }}>
        <Tabs
          defaultValue="one"
          controlSize={controlSize}
        >
          <TabsList aria-label="Narrow">
            <TabsTrigger value="one">Overview</TabsTrigger>
            <TabsTrigger value="two">Notifications</TabsTrigger>
            <TabsTrigger value="three">Members</TabsTrigger>
          </TabsList>
          <TabsContent value="one">One</TabsContent>
          <TabsContent value="two">Two</TabsContent>
          <TabsContent value="three">Three</TabsContent>
        </Tabs>
      </div>
    )
    const { tabs, list } = parts(host)
    expect(list.getBoundingClientRect().width).toBeLessThanOrEqual(180)
    expect(tabs[0].dataset.controlSize).toBe(controlSize)
    await act(async () => {
      tabs[0].focus()
      await userEvent.keyboard('{End}')
    })
    expect(document.activeElement).toBe(tabs[2])
    expect(tabs[2].getAttribute('aria-selected')).toBe('true')
  })
}

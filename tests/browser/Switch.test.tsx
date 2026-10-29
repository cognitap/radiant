import { act, createRef, StrictMode, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import { Checkbox, Field, Switch, ThemeScope, defineTheme } from '../../src/index.js'
import { SwitchSettingsExample } from '../../.storybook/examples/SwitchExamples.js'
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
  await commands.emulatePreferences({ reducedMotion: 'no-preference', forcedColors: 'none' })
})
const input = (host: HTMLElement) => host.querySelector<HTMLInputElement>('[data-slot=switch]')!
const thumb = (host: HTMLElement) =>
  host.querySelector<HTMLElement>('[data-slot=switch-indicator]')!

for (const direction of ['ltr', 'rtl']) {
  test(`${direction}: native label/Space activation keeps a stable name and moves the thumb to inline-end`, async () => {
    const changes = vi.fn(),
      blur = vi.fn()
    const { host } = await mount(
      <form dir={direction}>
        <Switch
          label="Desktop notifications"
          name="desktop"
          value="enabled"
          onChange={event => changes(event.target.checked)}
          onBlur={blur}
        />
        <button type="button">Next</button>
      </form>
    )
    const control = input(host),
      dot = thumb(host),
      before = dot.getBoundingClientRect()
    expect(control.type).toBe('checkbox')
    expect(control.getAttribute('role')).toBe('switch')
    expect(control).toHaveAccessibleName('Desktop notifications')
    expect(control.hasAttribute('aria-checked')).toBe(false)
    const offTrack = getComputedStyle(control).backgroundColor
    const offThumb = getComputedStyle(dot).backgroundColor
    await act(async () => {
      await userEvent.click(host.querySelector('label')!)
    })
    expect(control.checked).toBe(true)
    expect(control).toHaveAccessibleName('Desktop notifications')
    expect(changes).toHaveBeenCalledExactlyOnceWith(true)
    expect(new FormData(host.querySelector('form')!).get('desktop')).toBe('enabled')
    const after = dot.getBoundingClientRect()
    expect(direction === 'ltr' ? after.x > before.x : after.x < before.x).toBe(true)
    expect(getComputedStyle(control).backgroundColor).not.toBe(offTrack)
    expect(getComputedStyle(dot).backgroundColor).not.toBe(offThumb)
    expect(dot.closest('[aria-hidden=true]')).not.toBe(null)
    await act(async () => {
      control.focus()
      await userEvent.keyboard(' ')
    })
    expect(control.checked).toBe(false)
    expect(new FormData(host.querySelector('form')!).has('desktop')).toBe(false)
    expect(changes.mock.calls).toEqual([[true], [false]])
    expect(getComputedStyle(control).outlineStyle).not.toBe('none')
    await act(async () => {
      await userEvent.tab()
    })
    expect(blur).toHaveBeenCalledOnce()
  })
}

test('uncontrolled hydration, form association, silent reset and cancelled reset remain native', async () => {
  const changed = vi.fn(),
    ref = createRef<HTMLInputElement>()
  let cancel = false
  const { host } = await mount(
    <StrictMode>
      <form
        id="switch-external"
        onReset={event => {
          if (cancel) event.preventDefault()
        }}
      />
      <Field
        label="Automatic backups"
        description="Keep a copy."
      >
        <Switch
          name="backups"
          form="switch-external"
          defaultChecked
          ref={ref}
          onChange={changed}
        />
      </Field>
    </StrictMode>,
    true
  )
  const control = input(host),
    form = host.querySelector('form')!,
    id = control.id
  expect(ref.current).toBe(control)
  expect(control.form).toBe(form)
  expect(control.checked).toBe(true)
  expect(host.querySelector('label')!.htmlFor).toBe(id)
  await act(async () => {
    control.click()
  })
  expect(control.checked).toBe(false)
  cancel = true
  await act(async () => {
    form.reset()
  })
  expect(control.checked).toBe(false)
  cancel = false
  await act(async () => {
    form.reset()
  })
  expect(control.checked).toBe(true)
  expect(new FormData(form).get('backups')).toBe('on')
  expect(changed).toHaveBeenCalledOnce()
  expect(control.id).toBe(id)
})

test('controlled refusal, prop sync and browser reset keep the owner without fabricated changes', async () => {
  const changed = vi.fn()
  const tree = (checked: boolean) => (
    <form>
      <Switch
        label="Backups"
        checked={checked}
        onChange={changed}
        name="backup"
      />
    </form>
  )
  const { host, render } = await mount(tree(false))
  const control = input(host),
    form = host.querySelector('form')!
  await act(async () => {
    control.click()
  })
  expect(control.checked).toBe(false)
  expect(changed).toHaveBeenCalledOnce()
  await render(tree(true))
  expect(control.checked).toBe(true)
  expect(input(host)).toBe(control)
  await act(async () => {
    form.reset()
  })
  expect(control.checked).toBe(true)
  expect(changed).toHaveBeenCalledOnce()
})

test('native click cancellation prevents activation', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <Switch
      label="Cancelled"
      defaultChecked
      onClick={event => event.preventDefault()}
      onChange={change}
    />
  )
  const control = input(host)
  await act(async () => {
    await userEvent.click(control)
  })
  expect(control.checked).toBe(true)
})

test('Field owns IDs, help/error relationships and additive required state', async () => {
  const { host, render } = await mount(
    <form>
      <span id="switch-help">External help</span>
      <Field
        label="Backups"
        controlId="owned-switch"
        description="Help"
        error="Enable backups."
        required
      >
        <Switch
          id="ignored"
          name="backups"
          required={false}
          aria-invalid={false}
          aria-required={false}
          aria-describedby="switch-help switch-help"
        />
      </Field>
    </form>
  )
  const control = input(host),
    form = host.querySelector('form')!
  expect(control.id).toBe('owned-switch')
  expect(control.required).toBe(true)
  expect(control.getAttribute('aria-required')).toBe('true')
  expect(control.getAttribute('aria-invalid')).toBe('true')
  expect(control.hasAttribute('data-invalid')).toBe(true)
  const ids = control.getAttribute('aria-describedby')!.split(' ')
  expect(ids).toHaveLength(3)
  expect(ids.every(id => document.getElementById(id))).toBe(true)
  await act(async () => {
    form.reportValidity()
  })
  expect(control.validity.valueMissing).toBe(true)
  expect(document.activeElement).toBe(control)
  await act(async () => {
    control.click()
  })
  expect(control.validity.valid).toBe(true)
  await render(
    <Field
      layout="group"
      label="Workspace"
      disabled
    >
      <Field label="Backups">
        <Switch disabled={false} />
      </Field>
    </Field>
  )
  expect(input(host).disabled).toBe(true)
})

test('disabled controls skip Tab and payloads and do not dispatch changes', async () => {
  const changed = vi.fn()
  const { host } = await mount(
    <form>
      <button type="button">Before</button>
      <Field
        label="Locked"
        disabled
      >
        <Switch
          disabled={false}
          defaultChecked
          name="locked"
          onChange={changed}
        />
      </Field>
      <button type="button">After</button>
    </form>
  )
  const control = input(host),
    buttons = host.querySelectorAll('button')
  await act(async () => {
    await userEvent.click(buttons[0])
    await userEvent.tab()
    control.click()
  })
  expect(document.activeElement).toBe(buttons[1])
  expect(control.checked).toBe(true)
  expect(changed).not.toHaveBeenCalled()
  expect(new FormData(host.querySelector('form')!).has('locked')).toBe(false)
})

for (const controlSize of ['small', 'medium', 'large'] as const) {
  test(`${controlSize}: shared label metrics, square thumb and containment survive native input styles`, async () => {
    const { host } = await mount(
      <div style={{ width: 200 }}>
        <Switch
          label="AnExtremelyLongSettingNameWithoutSpacesForWorkspaceNotifications"
          controlSize={controlSize}
        />
        <Checkbox
          label="Comparison"
          controlSize={controlSize}
        />
      </div>
    )
    const control = input(host),
      dot = thumb(host)
    expect(getComputedStyle(host.querySelector('[data-slot=switch-label]')!).fontSize).toBe(
      getComputedStyle(host.querySelector('[data-slot=checkbox-label]')!).fontSize
    )
    const trackBox = control.getBoundingClientRect(),
      dotBox = dot.getBoundingClientRect()
    expect(dotBox.width).toBeCloseTo(dotBox.height, 1)
    expect(dotBox.height).toBeGreaterThan(10)
    expect(dotBox.left).toBeGreaterThan(trackBox.left)
    expect(dotBox.right).toBeLessThan(trackBox.right)
    expect(host.firstElementChild!.scrollWidth).toBe(200)
    expect(trackBox.width).toBeGreaterThan(trackBox.height)
  })
}

test('themes, caller styles and part replacements remain independent of Checkbox', async () => {
  const theme = defineTheme({
    id: 'switch-custom',
    name: 'Switch custom',
    components: {
      checkbox: { radius: '25px' },
      switch: {
        width: '60px',
        height: '30px',
        radius: '12px',
        thumb: 'rgb(120, 10, 20)',
        checkedThumb: 'rgb(20, 120, 10)'
      }
    }
  })
  let current: HTMLInputElement | null = null
  const cleaned = vi.fn()
  const { host, render } = await mount(
    <ThemeScope theme={theme}>
      <Switch
        label="Custom"
        ref={node => {
          current = node
          return () => {
            current = null
            cleaned()
          }
        }}
        className="rounded-none"
        style={{ '--rad-switch-width': '70px', transform: 'rotate(0deg)' }}
        parts={{
          wrapper: { className: 'gap-4' },
          label: { style: { fontStyle: 'italic' } },
          indicator: { className: 'rounded-none', style: { opacity: 0.7 } }
        }}
      />
      <Checkbox label="Checkbox" />
      <ThemeScope theme={defineTheme({ id: 'switch-inner', name: 'Inner' })}>
        <Switch label="Reset" />
      </ThemeScope>
    </ThemeScope>
  )
  const control = input(host),
    dot = thumb(host)
  expect(current).toBe(control)
  expect(control.getBoundingClientRect().width).toBe(70)
  expect(control.getBoundingClientRect().height).toBe(30)
  expect(getComputedStyle(control).borderRadius).toBe('0px')
  expect(getComputedStyle(dot).borderRadius).toBe('0px')
  expect(getComputedStyle(dot).opacity).toBe('0.7')
  expect(getComputedStyle(dot).backgroundColor).toBe('rgb(120, 10, 20)')
  await act(async () => {
    control.click()
  })
  expect(getComputedStyle(dot).backgroundColor).toBe('rgb(20, 120, 10)')
  expect(getComputedStyle(host.querySelector('[data-slot=switch-label]')!).fontStyle).toBe('italic')
  expect(getComputedStyle(host.querySelector('[data-slot=checkbox]')!).borderRadius).toBe('25px')
  expect(
    host.querySelectorAll<HTMLInputElement>('[data-slot=switch]')[1].getBoundingClientRect().width
  ).toBeLessThan(70)
  await render(null)
  expect(current).toBe(null)
  expect(cleaned).toHaveBeenCalledOnce()
})

test('forced colors retain the thumb, native focus and disabled cues with reduced motion', async () => {
  await commands.emulatePreferences({ forcedColors: 'active', reducedMotion: 'reduce' })
  const { host } = await mount(
    <>
      <Switch
        label="Available"
        defaultChecked
      />
      <Switch
        label="Locked"
        defaultChecked
        disabled
      />
    </>
  )
  const control = input(host),
    dot = thumb(host)
  await act(async () => {
    control.focus()
    await userEvent.keyboard(' ')
  })
  expect(control.checked).toBe(false)
  expect(getComputedStyle(control).outlineWidth).not.toBe('0px')
  expect(getComputedStyle(control).outlineStyle).not.toBe('none')
  expect(getComputedStyle(dot).backgroundColor).not.toBe(getComputedStyle(control).backgroundColor)
  const disabledThumb = host.querySelectorAll<HTMLElement>('[data-slot=switch-indicator]')[1]
  expect(getComputedStyle(dot).color).not.toBe(getComputedStyle(disabledThumb).color)
})

test('type, role, checked semantics and identity cannot be spoofed by native props', async () => {
  const spoofed = JSON.parse(
    '{"type":"radio","role":"button","aria-checked":"mixed","data-slot":"other","data-control-size":"other"}'
  )
  const { host } = await mount(
    <Switch
      {...spoofed}
      label="Stable"
      defaultChecked
    />
  )
  const control = input(host)
  expect(control.type).toBe('checkbox')
  expect(control.getAttribute('role')).toBe('switch')
  expect(control.getAttribute('aria-checked')).toBe(null)
  expect(control.getAttribute('data-control-size')).toBe('medium')
  expect(control.checked).toBe(true)
})

test('workspace preferences apply state immediately, submit only on settings and reset both owners', async () => {
  const { host } = await mount(<SwitchSettingsExample />)
  const [quiet, desktop] = host.querySelectorAll<HTMLInputElement>('[data-slot=switch]'),
    [save, reset] = host.querySelectorAll('button')
  await act(async () => {
    await userEvent.click(quiet)
  })
  expect(quiet.checked).toBe(true)
  expect(host.textContent).toContain('Your workspace is quiet.')
  await act(async () => {
    await userEvent.click(desktop)
    await userEvent.click(save)
  })
  expect(host.textContent).toContain('Saved locally: do not disturb on; desktop notifications off.')
  await act(async () => {
    await userEvent.click(reset)
  })
  expect(quiet.checked).toBe(false)
  expect(desktop.checked).toBe(true)
  expect(host.textContent).toContain('Preferences reset')
})

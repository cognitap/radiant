import { act, createRef, StrictMode, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import { Field, Switch } from '../../src/index.js'
import '../../.storybook/styles.css'

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const mounted: { host: HTMLDivElement; root: Root }[] = []
async function mount(tree: ReactNode) {
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  await act(async () => root.render(tree))
  mounted.push({ host, root })
  return { host, render: (tree: ReactNode) => act(async () => root.render(tree)) }
}
afterEach(async () => {
  await commands.dragSwitch('', 0, 'finish')
  for (const { host, root } of mounted.splice(0)) {
    await act(async () => root.unmount())
    host.remove()
  }
})

for (const direction of ['ltr', 'rtl'] as const) {
  for (const touch of [false, true]) {
    test(`${direction} ${touch ? 'touch' : 'mouse'}: drag previews and commits once, then ordinary click/Space remain native`, async () => {
      const changes = vi.fn(),
        clicks = vi.fn()
      const { host } = await mount(
        <form dir={direction}>
          <Switch
            id="drag-switch"
            label="Notifications"
            name="notifications"
            value="on"
            onChange={event => changes(event.target.checked)}
            onClick={clicks}
          />
        </form>
      )
      const input = host.querySelector('input')!
      let samples: Awaited<ReturnType<typeof commands.dragSwitch>>
      await act(async () => {
        samples = await commands.dragSwitch(
          '#drag-switch',
          direction === 'ltr' ? 25 : -25,
          'release',
          touch
        )
      })
      expect(samples!.before.checked).toBe(false)
      expect(samples!.during.checked).toBe(false)
      expect(samples!.during.dragging).toBe('')
      expect(
        direction === 'ltr'
          ? samples!.during.thumb!.x > samples!.before.thumb!.x
          : samples!.during.thumb!.x < samples!.before.thumb!.x
      ).toBe(true)
      expect(input.checked).toBe(true)
      expect(changes.mock.calls).toEqual([[true]])
      expect(clicks).toHaveBeenCalledOnce()
      expect(new FormData(host.querySelector('form')!).has('notifications')).toBe(true)
      expect(input.hasAttribute('data-dragging')).toBe(false)
      await act(async () => {
        await commands.dragSwitch('#drag-switch', direction === 'ltr' ? -25 : 25, 'release', touch)
      })
      expect(input.checked).toBe(false)
      expect(changes.mock.calls).toEqual([[true], [false]])
      await act(async () => {
        await userEvent.click(input)
      })
      expect(input.checked).toBe(true)
      await act(async () => {
        input.focus()
        await userEvent.keyboard(' ')
      })
      expect(input.checked).toBe(false)
      expect(changes.mock.calls).toEqual([[true], [false], [true], [false]])
    })
  }
}

test('a drag that stays on the original side neither changes state nor leaks a click', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <Switch
      id="short-drag"
      label="Short drag"
      onChange={change}
    />
  )
  const input = host.querySelector('input')!
  await act(async () => {
    await commands.dragSwitch('#short-drag', 5)
  })
  expect(input.checked).toBe(false)
  expect(change).not.toHaveBeenCalled()
  await act(async () => {
    await userEvent.click(host.querySelector('label')!)
  })
  expect(input.checked).toBe(true)
  expect(change).toHaveBeenCalledOnce()
})

for (const phase of ['cancel', 'escape', 'lostcapture'] as const) {
  test(`${phase} restores the current state and clears provisional thumb styling`, async () => {
    const change = vi.fn(),
      parentKey = vi.fn()
    const { host } = await mount(
      <Switch
        id="cancel-drag"
        label="Cancel"
        onChange={change}
      />
    )
    const input = host.querySelector('input')!,
      thumb = host.querySelector<HTMLElement>('[data-slot=switch-indicator]')!
    const handle = thumb.parentElement!,
      before = thumb.getBoundingClientRect().x
    const parent = host.parentElement!
    parent.addEventListener('keydown', parentKey)
    try {
      await act(async () => {
        await commands.dragSwitch('#cancel-drag', 25, phase)
      })
      expect(input.checked).toBe(false)
      expect(change).not.toHaveBeenCalled()
      expect(handle.style.transform).toBe('')
      expect(thumb.getBoundingClientRect().x).toBe(before)
      expect(input.hasAttribute('data-dragging')).toBe(false)
      if (phase === 'escape') expect(parentKey).not.toHaveBeenCalled()
    } finally {
      parent.removeEventListener('keydown', parentKey)
    }
  })
}

test('touch cancellation and vertical scroll intent do not commit a value', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <Switch
      id="touch-cancel"
      label="Touch"
      onChange={change}
    />
  )
  const input = host.querySelector('input')!
  await act(async () => {
    await commands.dragSwitch('#touch-cancel', 25, 'cancel', true)
  })
  expect(input.checked).toBe(false)
  expect(change).not.toHaveBeenCalled()
  expect(getComputedStyle(input).touchAction).toBe('pan-y')
  await act(async () => {
    await commands.dragSwitch('#touch-cancel', 0, 'release', true, 60)
  })
  expect(input.checked).toBe(false)
  expect(change).not.toHaveBeenCalled()
  expect(input.hasAttribute('data-dragging')).toBe(false)
})

test('controlled refusal and accepted prop sync settle to the value owner', async () => {
  const change = vi.fn()
  const tree = (checked: boolean) => (
    <Switch
      id="controlled-drag"
      label="Controlled"
      checked={checked}
      onChange={event => change(event.target.checked)}
    />
  )
  const { host, render } = await mount(tree(false))
  const input = host.querySelector('input')!,
    handle = host.querySelector<HTMLElement>('[data-slot=switch-indicator]')!.parentElement!
  await act(async () => {
    await commands.dragSwitch('#controlled-drag', 25)
  })
  expect(input.checked).toBe(false)
  expect(change.mock.calls).toEqual([[true]])
  expect(handle.style.transform).toBe('')
  await render(tree(true))
  await act(async () => {
    await commands.dragSwitch('#controlled-drag', -25)
  })
  expect(input.checked).toBe(true)
  expect(change.mock.calls).toEqual([[true], [false]])
})

test('consumer pointer cancellation and native click cancellation can veto a drag commit', async () => {
  const change = vi.fn()
  const { host, render } = await mount(
    <Switch
      id="veto-drag"
      label="Veto"
      onChange={change}
      onPointerUp={event => event.preventDefault()}
    />
  )
  const input = host.querySelector('input')!
  await act(async () => {
    await commands.dragSwitch('#veto-drag', 25)
  })
  expect(input.checked).toBe(false)
  expect(change).not.toHaveBeenCalled()
  await render(
    <Switch
      id="veto-drag"
      label="Veto"
      onChange={change}
      onClick={event => event.preventDefault()}
    />
  )
  await act(async () => {
    await commands.dragSwitch('#veto-drag', 25)
  })
  expect(input.checked).toBe(false)
})

test('disable, reset and unmount during capture clear the gesture without committing', async () => {
  const change = vi.fn(),
    ref = createRef<HTMLInputElement>()
  const tree = (disabled = false) => (
    <StrictMode>
      <form>
        <Field
          label="Locked"
          controlId="interrupt-drag"
          disabled={disabled}
        >
          <Switch
            id="interrupt-drag"
            ref={ref}
            onChange={change}
          />
        </Field>
      </form>
    </StrictMode>
  )
  const { host, render } = await mount(tree())
  const input = ref.current!,
    handle = host.querySelector<HTMLElement>('[data-slot=switch-indicator]')!.parentElement!
  await act(async () => {
    await commands.dragSwitch('#interrupt-drag', 25, 'hold')
  })
  expect(input.hasAttribute('data-dragging')).toBe(true)
  await render(tree(true))
  expect(handle.style.transform).toBe('')
  expect(input.hasAttribute('data-dragging')).toBe(false)
  await act(async () => {
    await commands.dragSwitch('', 0, 'finish')
  })
  expect(change).not.toHaveBeenCalled()
  await render(tree())
  await act(async () => {
    await commands.dragSwitch('#interrupt-drag', 25, 'hold')
  })
  await act(async () => {
    host.querySelector('form')!.reset()
  })
  expect(handle.style.transform).toBe('')
  await act(async () => {
    await commands.dragSwitch('', 0, 'finish')
  })
  expect(change).not.toHaveBeenCalled()
  await act(async () => {
    await commands.dragSwitch('#interrupt-drag', 25, 'hold')
  })
  await render(null)
  expect(handle.style.transform).toBe('')
  expect(ref.current).toBe(null)
  await act(async () => {
    await commands.dragSwitch('', 0, 'finish')
  })
  expect(change).not.toHaveBeenCalled()
})

test('dragging respects custom geometry, root direction and caller thumb transforms', async () => {
  const { host } = await mount(
    <div style={{ transform: 'scale(.75)', transformOrigin: 'left top' }}>
      <Switch
        id="custom-drag"
        dir="rtl"
        label="Custom"
        style={{ '--rad-switch-width': '80px', '--rad-switch-height': '32px' }}
        parts={{ indicator: { style: { transform: 'scale(.8)', opacity: 0.7 } } }}
      />
    </div>
  )
  const input = host.querySelector('input')!,
    thumb = host.querySelector<HTMLElement>('[data-slot=switch-indicator]')!
  const styles = thumb.style.cssText
  await act(async () => {
    await commands.dragSwitch('#custom-drag', -70)
  })
  expect(input.checked).toBe(true)
  expect(thumb.style.cssText).toBe(styles)
})

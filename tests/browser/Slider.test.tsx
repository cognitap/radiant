import { act, createRef, StrictMode, useState, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import { Field, Input, Slider, ThemeScope, defineTheme } from '../../src/index.js'
import { SliderSettingsExample } from '../../.storybook/examples/SliderExamples.js'
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
      ? hydrateRoot(host, tree, { onRecoverableError: e => errors.push(e) })
      : createRoot(host)
    if (!hydrate) root.render(tree)
  })
  mounted.push({ host, root })
  expect(errors).toEqual([])
  return { host, render: (next: ReactNode) => act(async () => root.render(next)) }
}
afterEach(async () => {
  for (const { host, root } of mounted.splice(0)) {
    await act(async () => root.unmount())
    host.remove()
  }
  await commands.emulatePreferences({ forcedColors: 'none', reducedMotion: 'no-preference' })
})

test('hydrated native range keeps Field labels, decimal stepping, bounds, focus and form payloads', async () => {
  const ref = createRef<HTMLInputElement>(),
    change = vi.fn(),
    blur = vi.fn()
  const { host } = await mount(
    <StrictMode>
      <form>
        <Field
          label="Playback speed"
          description="Half to double speed."
        >
          <Slider
            ref={ref}
            name="speed"
            min={0.5}
            max={2}
            step={0.25}
            defaultValue={1}
            onChange={change}
            onBlur={blur}
          />
        </Field>
        <button type="reset">Reset</button>
      </form>
    </StrictMode>,
    true
  )
  const input = ref.current!,
    form = host.querySelector('form')!
  expect(input.type).toBe('range')
  expect(input.labels?.[0].textContent).toBe('Playback speed')
  await act(async () => {
    await userEvent.click(input.labels![0])
    await userEvent.keyboard('{ArrowRight}')
  })
  expect(document.activeElement).toBe(input)
  expect(input.valueAsNumber).toBe(1.25)
  expect(new FormData(form).get('speed')).toBe('1.25')
  await act(async () => {
    await userEvent.keyboard('{Home}{ArrowLeft}')
  })
  expect(input.valueAsNumber).toBe(0.5)
  await act(async () => {
    await userEvent.keyboard('{End}{ArrowRight}')
  })
  expect(input.valueAsNumber).toBe(2)
  const count = change.mock.calls.length
  await act(async () => form.reset())
  expect(input.valueAsNumber).toBe(1)
  expect(change).toHaveBeenCalledTimes(count)
  await act(async () => {
    await userEvent.click(host.querySelector('button')!)
  })
  expect(blur).toHaveBeenCalledOnce()
})

for (const direction of ['ltr', 'rtl'] as const) {
  test(`${direction}: arrows follow inline direction and vertical Up increases toward the top`, async () => {
    const { host } = await mount(
      <div dir={direction}>
        <Field label="Volume">
          <Slider
            defaultValue={40}
            step={5}
          />
        </Field>
        <Field label="Gain">
          <Slider
            defaultValue={40}
            step={5}
            orientation="vertical"
          />
        </Field>
      </div>
    )
    const [horizontal, vertical] = host.querySelectorAll('input')
    await act(async () => {
      horizontal.focus()
      await userEvent.keyboard(direction === 'ltr' ? '{ArrowRight}' : '{ArrowLeft}')
    })
    expect(horizontal.valueAsNumber).toBe(45)
    await act(async () => {
      vertical.focus()
      await userEvent.keyboard('{ArrowUp}')
    })
    expect(vertical.valueAsNumber).toBe(45)
    expect(getComputedStyle(vertical).writingMode).toBe('vertical-lr')
    expect(vertical.getAttribute('aria-orientation')).toBe('vertical')
  })
  for (const touch of [false, true]) {
    test(`${direction}: real ${touch ? 'touch' : 'mouse'} drag adjusts a native range and emits change`, async () => {
      const change = vi.fn()
      const { host } = await mount(
        <div
          dir={direction}
          style={{ width: 300 }}
        >
          <Field
            label="Volume"
            controlId="drag-volume"
          >
            <Slider
              defaultValue={40}
              step={5}
              onChange={change}
            />
          </Field>
        </div>
      )
      await act(async () => {
        await commands.dragSlider('#drag-volume', 0.85, touch)
      })
      expect(host.querySelector('input')!.valueAsNumber).toBeGreaterThanOrEqual(80)
      expect(change).toHaveBeenCalled()
    })
  }
}

test('real vertical drag moves the native thumb upward without a pointer engine', async () => {
  const { host } = await mount(
    <Field
      label="Gain"
      controlId="drag-gain"
    >
      <Slider
        defaultValue={40}
        orientation="vertical"
      />
    </Field>
  )
  await act(async () => {
    await commands.dragSlider('#drag-gain', 0.9)
  })
  expect(host.querySelector('input')!.valueAsNumber).toBeGreaterThanOrEqual(85)
})

test('controlled refusal, owner updates and owner reset keep one value without synthetic changes', async () => {
  const change = vi.fn()
  function Example({ accept }: { accept: boolean }) {
    const [value, setValue] = useState(40)
    return (
      <form onReset={() => setValue(40)}>
        <Field label="Volume">
          <Slider
            value={value}
            step={5}
            aria-valuetext={`${value} percent`}
            onChange={e => {
              change(e.target.valueAsNumber)
              if (accept) setValue(e.target.valueAsNumber)
            }}
          />
        </Field>
        <button
          type="button"
          onClick={() => setValue(75)}
        >
          Set
        </button>
      </form>
    )
  }
  const view = await mount(<Example accept={false} />)
  const input = view.host.querySelector('input')!
  await act(async () => {
    input.focus()
    await userEvent.keyboard('{ArrowRight}')
  })
  expect(change).toHaveBeenLastCalledWith(45)
  expect(input.valueAsNumber).toBe(40)
  await view.render(<Example accept />)
  await act(async () => {
    input.focus()
    await userEvent.keyboard('{ArrowRight}')
  })
  expect(input.valueAsNumber).toBe(45)
  expect(input.getAttribute('aria-valuetext')).toBe('45 percent')
  await act(async () => {
    await userEvent.click(view.host.querySelector('button')!)
  })
  expect(input.valueAsNumber).toBe(75)
  expect(change).toHaveBeenCalledTimes(2)
  await act(async () => view.host.querySelector('form')!.reset())
  expect(input.valueAsNumber).toBe(40)
  expect(change).toHaveBeenCalledTimes(2)
})

test('Field protects ID and descriptions, inherits disabled state and omits disabled form entries', async () => {
  const { host } = await mount(
    <form>
      <p id="range-extra">External help</p>
      <Field
        layout="group"
        label="Audio"
        disabled
      >
        <Field
          controlId="range-owned"
          label="Volume"
          description="Local help"
          error="Choose a lower value."
        >
          <Slider
            id="ignored"
            disabled={false}
            aria-describedby="range-extra"
            defaultValue={40}
            name="volume"
          />
        </Field>
      </Field>
      <button>Next</button>
    </form>
  )
  const input = host.querySelector('input')!
  expect(input.id).toBe('range-owned')
  expect(input.disabled).toBe(true)
  expect(input.getAttribute('aria-invalid')).toBe('true')
  expect(input.hasAttribute('data-invalid')).toBe(true)
  const descriptions = input
    .getAttribute('aria-describedby')!
    .split(' ')
    .map(id => document.getElementById(id)?.textContent)
  expect(descriptions).toEqual(['Local help', 'Choose a lower value.', 'External help'])
  expect(new FormData(host.querySelector('form')!).has('volume')).toBe(false)
  await act(async () => {
    input.focus()
    await userEvent.tab()
  })
  expect(document.activeElement).not.toBe(input)
})

test('external form association and cancelled reset remain native', async () => {
  const { host } = await mount(
    <>
      <form
        id="range-form"
        onReset={e => e.preventDefault()}
      />
      <Field label="Volume">
        <Slider
          name="volume"
          form="range-form"
          defaultValue={40}
        />
      </Field>
    </>
  )
  const input = host.querySelector('input')!,
    form = host.querySelector('form')!
  await act(async () => {
    input.focus()
    await userEvent.keyboard('{End}')
  })
  expect(new FormData(form).get('volume')).toBe('100')
  await act(async () => form.reset())
  expect(input.valueAsNumber).toBe(100)
})

for (const controlSize of ['small', 'medium', 'large'] as const) {
  test(`${controlSize}: shared hit-area height fits narrow layouts and caller styles/ref reach the input`, async () => {
    const ref = createRef<HTMLInputElement>()
    const { host } = await mount(
      <div style={{ width: 180 }}>
        <Field label="Volume">
          <Slider
            ref={ref}
            controlSize={controlSize}
            defaultValue={40}
          />
        </Field>
        <Input
          aria-label="Title"
          controlSize={controlSize}
        />
      </div>
    )
    const [slider, input] = host.querySelectorAll('input')
    expect(ref.current).toBe(slider)
    expect(slider.getBoundingClientRect().width).toBe(180)
    expect(slider.getBoundingClientRect().height).toBe(input.getBoundingClientRect().height)
  })
}

test('independent slider overrides, caller classes and forced-colors native fallback preserve operation', async () => {
  const theme = defineTheme({
    id: 'slider-only',
    name: 'Slider',
    components: {
      input: { height: '90px' },
      slider: { height: '44px', thumbSize: '28px', trackSize: '8px' }
    }
  })
  const view = await mount(
    <ThemeScope theme={theme}>
      <Field label="Volume">
        <Slider
          defaultValue={40}
          className="w-64"
          style={{ '--rad-slider-thumb-radius': '999px' }}
        />
      </Field>
    </ThemeScope>
  )
  const input = view.host.querySelector('input')!
  expect(input.getBoundingClientRect().height).toBe(44)
  expect(input.getBoundingClientRect().width).toBe(256)
  expect(getComputedStyle(input).getPropertyValue('--rad-slider-thumb-size').trim()).toBe('28px')
  expect(input.style.getPropertyValue('--rad-slider-thumb-radius')).toBe('999px')
  await commands.emulatePreferences({ forcedColors: 'active', reducedMotion: 'reduce' })
  await expect.poll(() => getComputedStyle(input).appearance).toBe('auto')
  await act(async () => {
    input.focus()
    await userEvent.keyboard('{End}')
  })
  expect(input.valueAsNumber).toBe(100)
  expect(getComputedStyle(input).outlineStyle).not.toBe('none')
})

test('native bounds sanitize defaults, keyboard cancellation works, and spoofed roles/state cannot replace native semantics', async () => {
  const { host } = await mount(
    <Field label="Volume">
      <Slider
        {...JSON.parse(
          '{"type":"text","role":"spinbutton","required":true,"readOnly":true,"aria-valuenow":999,"data-slot":"other","data-orientation":"other"}'
        )}
        defaultValue={999}
        min={0}
        max={10}
        step={2}
        onKeyDown={e => e.preventDefault()}
      />
    </Field>
  )
  const input = host.querySelector('input')!
  expect(input.type).toBe('range')
  expect(input.valueAsNumber).toBe(10)
  expect(input.getAttribute('role')).toBeNull()
  expect(input.getAttribute('aria-valuenow')).toBeNull()
  expect(input.hasAttribute('required')).toBe(false)
  expect(input.readOnly).toBe(false)
  expect(input.dataset.slot).toBe('slider')
  expect(input.dataset.orientation).toBe('horizontal')
  await act(async () => {
    input.focus()
    await userEvent.keyboard('{Home}')
  })
  expect(input.valueAsNumber).toBe(10)
})

test('listening preferences submit and reset controlled and native defaults together', async () => {
  const { host } = await mount(<SliderSettingsExample />)
  const [volume, chime] = host.querySelectorAll('input')
  await act(async () => {
    volume.focus()
    await userEvent.keyboard('{End}')
    chime.focus()
    await userEvent.keyboard('{Home}')
  })
  await act(async () => {
    await userEvent.click(host.querySelector('button[type=submit]')!)
  })
  expect(host.querySelector('output')!.textContent).toBe('Saved locally: volume 100%; chime 0%.')
  await act(async () => {
    await userEvent.click(host.querySelector('button[type=reset]')!)
  })
  expect(volume.valueAsNumber).toBe(50)
  expect(chime.valueAsNumber).toBe(30)
  expect(host.querySelector('output')!.textContent).toBe('Preferences reset')
})

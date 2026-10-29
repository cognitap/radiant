import { act, StrictMode, useEffect, useRef } from 'react'
import { hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import { Button, ThemeScope, defineTheme } from '../../src/index.js'
import { bindSpringLayout } from '../../src/motion/index.js'
import { useSpringLayout, useReducedMotion } from '../../src/motion/react.js'
import type {} from './mediaCommands.js'

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
async function until(check: () => boolean) {
  await expect.poll(check, { timeout: 4_000 }).toBe(true)
}
const cleanup: (() => void)[] = []
const roots: Root[] = []
afterEach(async () => {
  for (const root of roots.splice(0)) await act(async () => root.unmount())
  cleanup
    .splice(0)
    .reverse()
    .forEach(dispose => dispose())
  await act(async () => commands.emulatePreferences({ reducedMotion: 'no-preference' }))
})
function fixture() {
  const root = document.createElement('div')
  root.style.cssText =
    'display:grid;grid-template-columns:repeat(2, 140px);gap:16px;width:296px;border:4px solid black;padding:8px;max-height:180px;overflow:auto'
  root.innerHTML = ['Alpha', 'Beta', 'Gamma']
    .map(
      (name, i) =>
        `<div data-rad-layout-slot style="display:flow-root"><div data-rad-layout-part style="display:flow-root;border:2px solid black;padding:12px;border-radius:8px"><form><label>${name}<input name="item" value="${name}"></label><button type="submit">Save ${name}</button></form><p>${i === 0 ? 'Some text wraps naturally here.' : 'Short content.'}</p></div></div>`
    )
    .join('')
  document.body.append(root)
  cleanup.push(() => root.remove())
  const slots = Array.from(root.children) as HTMLElement[]
  const parts = slots.map(slot => slot.firstElementChild as HTMLElement)
  const layout = bindSpringLayout(root, { parameters: { stiffness: 260, damping: 24 } })
  cleanup.push(() => layout.destroy())
  return { root, slots, parts, layout }
}

test('reorder and repeated reversal retain measured position and signed momentum without scaling content', async () => {
  const { root, slots, parts, layout } = fixture()
  const first = slots[0]!
  const before = layout.get(first)!
  root.append(first)
  layout.measure()
  expect(layout.get(first)).toEqual(before)
  expect(parts[0]!.style.scale).toBe('')
  expect(parts[0]!.style.transform).toBe('')
  const localY = () =>
    parts[0]!.getBoundingClientRect().top -
    root.getBoundingClientRect().top -
    root.clientTop +
    root.scrollTop
  expect(localY()).toBeCloseTo(before.y, 1)
  await until(() => layout.get(first)!.y > before.y + 20)
  const moving = layout.get(first)!
  const velocity = layout.getVelocity(first)!
  expect(velocity.y).toBeGreaterThan(1)
  root.prepend(first)
  layout.measure()
  expect(layout.get(first)).toEqual(moving)
  expect(layout.getVelocity(first)!.y).toBeCloseTo(velocity.y, 2)
  const positions: number[] = []
  for (let i = 0; i < 3; i++) {
    await frame()
    positions.push(layout.get(first)!.y)
  }
  expect(positions.some(value => value > moving.y)).toBe(true)
  for (let i = 0; i < 4; i++) {
    const current = layout.get(first)!
    if (i % 2) root.prepend(first)
    else root.append(first)
    layout.measure()
    expect(layout.get(first)).toEqual(current)
    await frame()
  }
  await until(() => !layout.isAnimating())
  expect(parts[0]!.style.position).toBe('')
  expect(parts[0]!.style.translate).toBe('')
  expect(parts[0]!.getBoundingClientRect().width).toBeCloseTo(
    first.getBoundingClientRect().width,
    1
  )
  expect(getComputedStyle(parts[0]!).borderLeftWidth).toBe('2px')
})

test('intrinsic text changes and responsive reflow are measured together; scroll does not become animation', async () => {
  const { root, slots, parts, layout } = fixture()
  root.scrollTop = 40
  layout.measure()
  const scrolled = layout.get(slots[0]!)!
  root.scrollTop = 0
  layout.measure()
  expect(layout.get(slots[0]!)).toEqual(scrolled)
  expect(layout.isAnimating()).toBe(false)
  parts[0]!.querySelector('p')!.textContent = 'Changing content '.repeat(15)
  await until(() => layout.isAnimating())
  const oldWidth = layout.get(slots[0]!)!.width
  root.style.gridTemplateColumns = 'repeat(1, 296px)'
  await until(() => layout.get(slots[0]!)!.width > oldWidth + 1)
  const current = layout.get(slots[0]!)!
  const widthVelocity = layout.getVelocity(slots[0]!)!.width
  expect(widthVelocity).toBeGreaterThan(1)
  root.style.gridTemplateColumns = 'repeat(2, 140px)'
  layout.measure()
  expect(layout.get(slots[0]!)).toEqual(current)
  expect(layout.getVelocity(slots[0]!)!.width).toBeCloseTo(widthVelocity, 2)
  await until(() => !layout.isAnimating())
  expect(layout.get(slots[0]!)!.width).toBe(140)
  expect(parts[0]!.style.width).toBe('')
  expect(parts[0]!.getBoundingClientRect().height).toBeGreaterThan(150)
})

test('resize preserves real host, selection, native form submission, caller rotation and cleanup', async () => {
  const { root, slots, parts, layout } = fixture()
  const input = parts[0]!.querySelector('input')!
  const form = parts[0]!.querySelector('form')!
  let submitted = ''
  form.addEventListener('submit', event => {
    event.preventDefault()
    submitted = String(new FormData(form).get('item'))
  })
  input.focus()
  input.setSelectionRange(1, 3)
  parts[0]!.querySelector('button')!.style.transform = 'rotate(4deg)'
  root.style.gridTemplateColumns = 'repeat(1, 296px)'
  layout.measure()
  await until(() => layout.isAnimating() && layout.get(slots[0]!)!.width > 150)
  expect(document.activeElement).toBe(input)
  expect(input.selectionStart).toBe(1)
  expect(input.selectionEnd).toBe(3)
  await userEvent.keyboard('{Enter}')
  expect(submitted).toBe('Alpha')
  expect(parts[0]!.querySelector('input')).toBe(input)
  expect(parts[0]!.querySelector('button')!.style.transform).toBe('rotate(4deg)')
  layout.destroy()
  layout.destroy()
  expect(parts[0]!.style.position).toBe('')
  expect(slots[0]!.style.width).toBe('')
  root.style.gridTemplateColumns = 'repeat(2, 140px)'
  await frame()
  expect(layout.isAnimating()).toBe(false)
  expect(layout.get(slots[0]!)).toBeUndefined()
})

test('removed/replaced parts release observers and styles; disabled layout stays natural and validates options', async () => {
  const { root, slots, parts, layout } = fixture()
  root.append(slots[0]!)
  layout.measure()
  await until(() => layout.isAnimating())
  layout.configure({ enabled: false })
  expect(layout.isAnimating()).toBe(false)
  expect(parts[0]!.style.position).toBe('')
  expect(() => layout.configure({ parameters: { mass: -1 } })).toThrow()
  expect(() => layout.configure({ reducedValue: 0 })).toThrow()
  slots[0]!.remove()
  layout.measure()
  expect(layout.get(slots[0]!)).toBeUndefined()
  expect(parts[0]!.style.translate).toBe('')
  const old = parts[1]!
  const replacement = old.cloneNode(true) as HTMLElement
  slots[1]!.replaceChildren(replacement)
  layout.measure()
  expect(old.style.position).toBe('')
  expect(replacement.style.position).toBe('')
  layout.configure({ enabled: true })
  root.append(slots[1]!)
  layout.measure()
  expect(layout.get(slots[1]!)).toBeDefined()
})

let owned: ReturnType<typeof useSpringLayout>
let reduced = true
let commits = 0
const offTheme = defineTheme({ id: 'layout-off', name: 'Layout off', motion: { mode: 'off' } })
function ReactLayout({ wide = false, alternate = false }: { wide?: boolean; alternate?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const controller = useSpringLayout(ref)
  const preference = useReducedMotion()
  useEffect(() => {
    owned = controller
    reduced = preference
    commits++
  })
  return (
    <div
      key={String(alternate)}
      ref={ref}
      style={{ display: 'grid', gridTemplateColumns: wide ? '260px' : '120px' }}
    >
      <div
        data-rad-layout-slot=""
        style={{ display: 'flow-root' }}
      >
        <div
          data-rad-layout-part=""
          style={{ display: 'flow-root' }}
        >
          <Button>Native layout button</Button>
          <p>Reflowing text stays real text.</p>
        </div>
      </div>
    </div>
  )
}

test('React binds before paint, hydrates, survives StrictMode and host replacement, and follows live reduced/theme off', async () => {
  await act(async () => commands.emulatePreferences({ reducedMotion: 'no-preference' }))
  const host = document.createElement('div')
  document.body.append(host)
  cleanup.push(() => host.remove())
  const element = (
    <StrictMode>
      <ReactLayout />
    </StrictMode>
  )
  host.innerHTML = renderToString(element)
  const button = host.querySelector('button')!
  expect(host.querySelector<HTMLElement>('[data-rad-layout-part]')!.style.position).toBe('')
  const errors: unknown[] = []
  let root: Root
  await act(async () => {
    root = hydrateRoot(host, element, { onRecoverableError: error => errors.push(error) })
    roots.push(root)
  })
  await until(() => !reduced)
  expect(errors).toEqual([])
  expect(host.querySelector('button')).toBe(button)
  const original = owned
  await act(async () =>
    root.render(
      <StrictMode>
        <ReactLayout wide />
      </StrictMode>
    )
  )
  await until(() => owned.isAnimating())
  const count = commits
  await frame()
  expect(commits).toBe(count)
  await act(async () => commands.emulatePreferences({ reducedMotion: 'reduce' }))
  await until(() => !owned.isAnimating() && reduced)
  expect(host.querySelector<HTMLElement>('[data-rad-layout-part]')!.style.width).toBe('')
  await act(async () =>
    root.render(
      <StrictMode>
        <ReactLayout alternate />
      </StrictMode>
    )
  )
  expect(owned).toBe(original)
  expect(host.querySelector('button')).not.toBe(button)
  await act(async () =>
    root.render(
      <ThemeScope theme={offTheme}>
        <ReactLayout wide />
      </ThemeScope>
    )
  )
  expect(owned.isAnimating()).toBe(false)
  const prior = owned
  await act(async () => root.render(null))
  expect(prior.isAnimating()).toBe(false)
})

test('nested controls and native modal semantics remain immediate during layout motion', async () => {
  const { root, slots, parts, layout } = fixture()
  const dialog = document.createElement('dialog')
  dialog.innerHTML =
    '<form method="dialog"><label>Modal value<input name="modal"></label><button>Close native dialog</button></form>'
  parts[0]!.append(dialog)
  const trigger = parts[0]!.querySelector('button')!
  trigger.focus()
  dialog.showModal()
  expect(dialog.matches(':modal')).toBe(true)
  root.style.gridTemplateColumns = 'repeat(1, 296px)'
  layout.measure()
  expect(layout.isAnimating()).toBe(true)
  expect(dialog.contains(document.activeElement)).toBe(true)
  await userEvent.keyboard('{Escape}')
  expect(dialog.open).toBe(false)
  expect(document.activeElement).toBe(trigger)
  expect(parts[0]!.contains(dialog)).toBe(true)
  expect(layout.get(slots[0]!)).toBeDefined()
})

test('invalid geometry is rejected and caller-reclaimed inline values survive disposal', async () => {
  const invalid = document.createElement('div')
  invalid.innerHTML =
    '<div data-rad-layout-slot style="padding:10px"><div data-rad-layout-part>Invalid slot</div></div>'
  document.body.append(invalid)
  cleanup.push(() => invalid.remove())
  expect(() => bindSpringLayout(invalid)).toThrow(/unpadded/)
  expect(invalid.firstElementChild!.getAttribute('style')).toBe('padding:10px')
  const { root, slots, parts, layout } = fixture()
  root.append(slots[0]!)
  layout.measure()
  parts[0]!.style.setProperty('translate', '13px 9px', 'important')
  layout.destroy()
  expect(parts[0]!.style.translate).toBe('13px 9px')
  expect(parts[0]!.style.getPropertyPriority('translate')).toBe('important')
})

test('translated outer scrollers share stable local pixels; scaled coordinate spaces are rejected', async () => {
  const { root, slots, layout } = fixture()
  const outer = document.createElement('div')
  outer.style.cssText = 'height:120px;overflow:auto;transform:translate(20px, 15px)'
  document.body.append(outer)
  cleanup.push(() => outer.remove())
  outer.append(root)
  const spacer = document.createElement('div')
  spacer.style.height = '400px'
  outer.prepend(spacer)
  layout.measure()
  const before = layout.get(slots[0]!)!
  outer.scrollTop = 250
  layout.measure()
  expect(layout.get(slots[0]!)).toEqual(before)
  expect(layout.isAnimating()).toBe(false)
  layout.destroy()
  outer.style.transform = 'scale(.8)'
  expect(() => bindSpringLayout(root)).toThrow(/coordinate space/)
})

test('flex reflow preserves measured boxes and restores newly authored inline baselines', async () => {
  const { root, slots, parts, layout } = fixture()
  root.style.cssText = 'display:flex;gap:12px;width:360px'
  slots.forEach(slot => {
    slot.style.flex = '1 1 0'
    slot.style.minWidth = '0'
  })
  layout.measure()
  await until(() => !layout.isAnimating())
  parts[0]!.style.position = 'relative'
  const initial = layout.get(slots[0]!)!
  root.style.width = '480px'
  layout.measure()
  expect(layout.get(slots[0]!)).toEqual(initial)
  expect(slots[0]!.getBoundingClientRect().width).toBeCloseTo(152, 1)
  await until(() => !layout.isAnimating())
  expect(parts[0]!.style.position).toBe('relative')
  expect(slots[0]!.style.flex).toBe('1 1 0px')
  expect(layout.get(slots[0]!)!.width).toBeCloseTo(152, 1)
})

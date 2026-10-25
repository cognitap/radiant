import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  pretendToBeVisual: true,
  url: 'http://localhost/'
})
for (const key of [
  'window',
  'document',
  'HTMLElement',
  'HTMLDialogElement',
  'Node',
  'Element',
  'MutationObserver',
  'getComputedStyle',
  'DocumentFragment'
]) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    writable: true,
    value: dom.window[key]
  })
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true
const { act, createElement: h, createRef } = await import('react')
const { createRoot } = await import('react-dom/client')
const {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  Checkbox,
  Collapsible,
  CollapsibleTrigger,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Input,
  Radio,
  RadioGroup,
  useAccordion,
  useCollapsible,
  useDialog
} = await import('../dist/library/index.js')
const mounted = []

async function mount(element) {
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  mounted.push({ root, host })
  await act(async () => root.render(element))
  return { host, root }
}

afterEach(async () => {
  for (const { root, host } of mounted.splice(0)) {
    await act(async () => root.unmount())
    host.remove()
  }
})

test('composed native refs retain cleanup and do not detach on unrelated renders', async () => {
  for (const Control of [Checkbox, Radio, DialogContent]) {
    const attached = []
    const cleaned = []
    const ref = node => {
      attached.push(node)
      if (node) return () => cleaned.push(node)
    }
    const element = title =>
      Control === DialogContent
        ? h(
            Dialog,
            null,
            h(
              Control,
              { ref, title },
              h(DialogTitle, null, 'Panel'),
              h(DialogDescription, null, 'Details')
            )
          )
        : h(Control, {
            ref,
            title,
            'aria-label': 'Option',
            value: 'yes',
            indeterminate: Control === Checkbox ? true : undefined
          })
    const { host, root } = await mount(element('First'))
    const node = host.querySelector(Control === DialogContent ? 'dialog' : 'input')
    assert.deepEqual(attached, [node])
    await act(async () => root.render(element('Updated')))
    assert.deepEqual(attached, [node], 'ordinary prop changes must not reattach refs')
    assert.deepEqual(cleaned, [])
    await act(async () => root.render(null))
    assert.deepEqual(cleaned, [node], 'returned cleanup runs once instead of a null callback')
    assert.deepEqual(attached, [node])
  }
})

test('replacing a composed ref releases the old ref and updates the new real host ref', async () => {
  const old = []
  const ref = node => {
    old.push(node)
    return node ? () => old.push('released') : undefined
  }
  const next = createRef()
  const { host, root } = await mount(h(Checkbox, { ref, label: 'Email', indeterminate: true }))
  const input = host.querySelector('input')
  assert.equal(input.indeterminate, true)
  await act(async () =>
    root.render(h(Checkbox, { ref: next, label: 'Email', indeterminate: false }))
  )
  assert.deepEqual(old, [input, 'released'])
  assert.equal(next.current, input)
  assert.equal(input.indeterminate, false)
  await act(async () => root.render(null))
  assert.equal(next.current, null)
})

test('disclosure mount, prop synchronisation and rejected restoration are not change requests', async () => {
  const changes = []
  const observations = []
  const tree = open =>
    h(
      Collapsible,
      {
        open,
        onOpenChange: value => changes.push(value),
        onToggle: event => observations.push(event.currentTarget.open)
      },
      h(CollapsibleTrigger, null, 'Shipping')
    )
  const { host, root } = await mount(tree(true))
  const flush = async () =>
    act(async () => {
      await new Promise(resolve => dom.window.setTimeout(resolve, 0))
    })
  await flush()
  assert.deepEqual(changes, [], 'initial native toggle only observes the mounted state')
  await act(async () => root.render(tree(false)))
  await flush()
  assert.deepEqual(changes, [], 'a controlled prop update is not another user request')
  host.querySelector('details').open = true
  await flush()
  await flush()
  assert.deepEqual(changes, [true], 'declining an open request does not emit a restoration request')
  assert.equal(host.querySelector('details').open, false)
  assert.ok(observations.length > 0, 'native observations are still forwarded')
})

test('public state hooks suppress no-op requests and use the current callback', async () => {
  for (const [Owner, useOwner] of [
    [Dialog, useDialog],
    [Collapsible, useCollapsible]
  ]) {
    const changes = []
    function Actions() {
      const state = useOwner()
      return h(
        'div',
        null,
        h('button', { onClick: () => state.setOpen(state.open) }, 'Keep'),
        h(
          'button',
          {
            onClick: () => {
              state.setOpen(!state.open)
              state.setOpen(!state.open)
            }
          },
          'Toggle'
        )
      )
    }
    const tree = callback => h(Owner, { defaultOpen: false, onOpenChange: callback }, h(Actions))
    const { host, root } = await mount(tree(value => changes.push(['old', value])))
    await act(async () => host.querySelector('button').click())
    assert.deepEqual(changes, [])
    await act(async () => root.render(tree(value => changes.push(['new', value]))))
    await act(async () => host.querySelectorAll('button')[1].click())
    assert.deepEqual(changes, [['new', true]])
  }
})

test('Dialog combines owned and external description IDs without losing relationships', async () => {
  const { host } = await mount(
    h(
      Dialog,
      null,
      h(DialogTrigger, null, 'Open'),
      h(
        DialogContent,
        { 'aria-describedby': 'help help extra' },
        h(DialogTitle, null, 'Panel'),
        h(DialogDescription, null, 'Owned description'),
        h(DialogClose, null, 'Close')
      ),
      h('p', { id: 'help' }, 'Help'),
      h('p', { id: 'extra' }, 'Extra')
    )
  )
  const owned = host.querySelector('[data-slot="dialog-description"]').id
  assert.deepEqual(host.querySelector('dialog').getAttribute('aria-describedby').split(' '), [
    owned,
    'help',
    'extra'
  ])
})

test('disabled Accordion activation guards run before consumer handlers', async () => {
  const seen = []
  const { host } = await mount(
    h(
      Accordion,
      null,
      h(
        AccordionItem,
        { value: 'shipping', disabled: true },
        h(
          AccordionTrigger,
          { onClick: () => seen.push('click'), onKeyDown: () => seen.push('key') },
          'Shipping'
        )
      )
    )
  )
  const summary = host.querySelector('summary')
  await act(async () => summary.click())
  const key = new dom.window.KeyboardEvent('keydown', {
    key: 'Enter',
    bubbles: true,
    cancelable: true
  })
  await act(async () => summary.dispatchEvent(key))
  assert.equal(key.defaultPrevented, true)
  assert.deepEqual(seen, [])
  assert.equal(host.querySelector('details').open, false)
})

test('multiple Accordion requests in one event preserve previous accepted requests', async () => {
  const changes = []
  function Actions() {
    const state = useAccordion()
    return h(
      'button',
      {
        onClick: () => {
          state.setItemOpen('shipping', true)
          state.setItemOpen('returns', true)
          state.setItemOpen('returns', true)
        }
      },
      'Open both'
    )
  }
  const { host, root } = await mount(
    h(
      Accordion,
      { type: 'multiple', defaultValue: [], onValueChange: value => changes.push(value) },
      h(Actions)
    )
  )
  await act(async () => host.querySelector('button').click())
  assert.deepEqual(changes, [['shipping'], ['shipping', 'returns']])
  await act(async () =>
    root.render(
      h(
        Accordion,
        { type: 'multiple', defaultValue: ['other'], onValueChange: value => changes.push(value) },
        h(Actions)
      )
    )
  )
  await act(async () => host.querySelector('button').click())
  assert.equal(changes.length, 2, 'changing a composite default does not reset live selection')
})

test('state owners diagnose mixed ownership and mode changes instead of silently changing policy', async () => {
  for (const [Owner, property, defaultProperty, value, props] of [
    [Dialog, 'open', 'defaultOpen', false, {}],
    [Collapsible, 'open', 'defaultOpen', false, {}],
    [Accordion, 'value', 'defaultValue', null, {}],
    [RadioGroup, 'value', 'defaultValue', null, { label: 'Plan', name: 'plan' }],
    [Input, 'value', 'defaultValue', '', { readOnly: true }],
    [Checkbox, 'checked', 'defaultChecked', false, { readOnly: true }],
    [Radio, 'checked', 'defaultChecked', false, { value: 'yes', readOnly: true }]
  ]) {
    const { root } = await mount(h(Owner, { ...props, [property]: value }))
    await assert.rejects(async () => {
      await act(async () => root.render(h(Owner, props)))
    }, /cannot switch between controlled and uncontrolled/)
    const another = await mount(h(Owner, { ...props, [defaultProperty]: value }))
    await assert.rejects(async () => {
      await act(async () => another.root.render(h(Owner, { ...props, [property]: value })))
    }, /cannot switch between controlled and uncontrolled/)
    const mixed = await mount(null)
    await assert.rejects(async () => {
      await act(async () =>
        mixed.root.render(h(Owner, { ...props, [property]: value, [defaultProperty]: value }))
      )
    }, /controlled value or a default, not both/)
  }
  const { root } = await mount(h(Accordion, { type: 'single' }))
  await assert.rejects(async () => {
    await act(async () => root.render(h(Accordion, { type: 'multiple' })))
  }, /cannot change type/)
})

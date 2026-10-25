import assert from 'node:assert/strict'
import { test } from 'node:test'
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  pretendToBeVisual: true,
  url: 'http://localhost/'
})

for (const key of [
  'window',
  'document',
  'HTMLElement',
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

const { act, createElement, createRef, useState } = await import('react')
const { createRoot, hydrateRoot } = await import('react-dom/client')
const { renderToString } = await import('react-dom/server')
const { Checkbox } = await import('../dist/library/index.js')

function mount() {
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  return { host, root }
}

test('a checked checkbox hydrates and applies the mixed state on the DOM property', async () => {
  const element = createElement(Checkbox, {
    label: 'Email',
    name: 'channels',
    value: 'email',
    defaultChecked: true,
    indeterminate: true
  })
  const html = renderToString(element)
  assert.match(html, /checked/)
  assert.doesNotMatch(html, /indeterminate=/)
  const root = document.getElementById('root')
  root.innerHTML = html
  const recoverable = []
  await act(async () => {
    hydrateRoot(root, element, {
      onRecoverableError(error) {
        recoverable.push(String(error))
      }
    })
  })
  assert.deepEqual(recoverable, [])
  const input = root.querySelector('input')
  assert.equal(input.checked, true)
  assert.equal(input.indeterminate, true)
})

test('a label click toggles an uncontrolled checkbox, a disabled one stays put, and reset restores it', async () => {
  const seen = { submitted: [] }
  function Form() {
    return createElement(
      'form',
      {
        onSubmit(event) {
          event.preventDefault()
          seen.submitted = [...new dom.window.FormData(event.currentTarget).getAll('channels')]
        }
      },
      createElement(Checkbox, {
        label: 'Email',
        name: 'channels',
        value: 'email',
        defaultChecked: true
      }),
      createElement(Checkbox, { label: 'SMS', name: 'channels', value: 'sms', disabled: true }),
      createElement('button', { type: 'submit' }, 'Save')
    )
  }

  const { host, root } = mount()
  await act(async () => root.render(createElement(Form)))
  const [email, sms] = host.querySelectorAll('input')
  await act(async () => host.querySelector('label').click())
  assert.equal(email.checked, false)
  await act(async () => host.querySelectorAll('label')[1].click())
  assert.equal(sms.checked, false)
  await act(async () => {
    host
      .querySelector('form')
      .dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }))
  })
  assert.deepEqual(seen.submitted, [])
  await act(async () => host.querySelector('form').reset())
  assert.equal(host.querySelector('input').checked, true)
  root.unmount()
})

test('the mixed state does not change what the form submits', async () => {
  function Form({ checked }) {
    return createElement(
      'form',
      {
        onSubmit(event) {
          event.preventDefault()
          event.currentTarget.dataset.submitted =
            new dom.window.FormData(event.currentTarget).get('all') ?? ''
        }
      },
      createElement(Checkbox, {
        label: 'All',
        name: 'all',
        value: 'all',
        defaultChecked: checked,
        indeterminate: true
      })
    )
  }

  const { host, root } = mount()
  await act(async () => root.render(createElement(Form, { checked: false })))
  const form = host.querySelector('form')
  assert.equal(host.querySelector('input').indeterminate, true)
  await act(async () => {
    form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }))
  })
  assert.equal(form.dataset.submitted, '')
  root.unmount()

  const again = mount()
  await act(async () => again.root.render(createElement(Form, { checked: true })))
  const checkedForm = again.host.querySelector('form')
  await act(async () => {
    checkedForm.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }))
  })
  assert.equal(checkedForm.dataset.submitted, 'all')
  again.root.unmount()
})

test('a controlled checkbox keeps React state across a browser reset', async () => {
  function Controlled() {
    const [checked, setChecked] = useState(true)
    return createElement(
      'form',
      null,
      createElement(Checkbox, {
        label: 'Email',
        checked,
        onChange: event => setChecked(event.target.checked)
      })
    )
  }

  const { host, root } = mount()
  await act(async () => root.render(createElement(Controlled)))
  assert.equal(host.querySelector('input').checked, true)
  await act(async () => host.querySelector('label').click())
  assert.equal(host.querySelector('input').checked, false)
  await act(async () => host.querySelector('form').reset())
  assert.equal(host.querySelector('input').checked, false)
  root.unmount()
})

test('a ref points at the checkbox and sees the mixed state', async () => {
  const ref = createRef()
  const { host, root } = mount()
  await act(async () => {
    root.render(createElement(Checkbox, { label: 'Email', indeterminate: true, ref }))
  })
  assert.equal(ref.current, host.querySelector('input'))
  assert.equal(ref.current.indeterminate, true)
  root.unmount()
})

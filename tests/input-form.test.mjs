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
const { useForm } = await import('@tanstack/react-form')
const { Field, Input } = await import('../dist/library/index.js')

const valueSetter = Object.getOwnPropertyDescriptor(
  dom.window.HTMLInputElement.prototype,
  'value'
).set

function mount(element) {
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  return { host, root, render: node => act(async () => root.render(node ?? element)) }
}

function typeInto(input, value) {
  valueSetter.call(input, value)
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
  input.dispatchEvent(new dom.window.Event('change', { bubbles: true }))
}

function submit(form) {
  form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }))
}

function blur(input) {
  input.dispatchEvent(new dom.window.Event('focusout', { bubbles: true }))
}

test('server markup for an uncontrolled input hydrates', async () => {
  const element = createElement(Input, { name: 'email', defaultValue: 'ada@example.com' })
  const html = renderToString(element)
  assert.match(html, /value="ada@example.com"/)
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
  assert.equal(root.querySelector('input').value, 'ada@example.com')
})

test('an uncontrolled input reports change and blur, submits, and resets', async () => {
  const seen = { value: '', blurred: 0, submitted: '' }
  function Plain() {
    return createElement(
      'form',
      {
        onSubmit(event) {
          event.preventDefault()
          seen.submitted = new dom.window.FormData(event.currentTarget).get('email')
        }
      },
      createElement(Input, {
        name: 'email',
        defaultValue: 'ada@example.com',
        onBlur: () => {
          seen.blurred += 1
        },
        onChange: event => {
          seen.value = event.target.value
        }
      }),
      createElement('button', { type: 'submit' }, 'Save')
    )
  }

  const { host, root } = mount()
  await act(async () => root.render(createElement(Plain)))
  const input = host.querySelector('input')
  await act(async () => typeInto(input, 'grace@example.com'))
  assert.equal(seen.value, 'grace@example.com')
  await act(async () => blur(input))
  assert.equal(seen.blurred, 1)
  await act(async () => submit(host.querySelector('form')))
  assert.equal(seen.submitted, 'grace@example.com')
  await act(async () => host.querySelector('form').reset())
  assert.equal(host.querySelector('input').value, 'ada@example.com')
  root.unmount()
})

test('a controlled input keeps React state across a browser reset', async () => {
  function Controlled() {
    const [value, setValue] = useState('kept')
    return createElement(
      'form',
      null,
      createElement(Input, {
        name: 'name',
        value,
        onChange: event => setValue(event.target.value)
      }),
      createElement('button', { type: 'reset' }, 'Reset')
    )
  }

  const { host, root } = mount()
  await act(async () => root.render(createElement(Controlled)))
  const input = host.querySelector('input')
  await act(async () => typeInto(input, 'next'))
  assert.equal(input.value, 'next')
  await act(async () => host.querySelector('form').reset())
  assert.equal(host.querySelector('input').value, 'next')
  root.unmount()
})

test('a ref points at the input element', async () => {
  const ref = createRef()
  const { host, root } = mount()
  await act(async () => root.render(createElement(Input, { name: 'email', ref })))
  assert.equal(ref.current, host.querySelector('input'))
  root.unmount()
})

test('TanStack Form drives value, blur, submit, and reset through Input', async () => {
  const seen = { submitted: undefined, submit: async () => {} }
  function Reference() {
    const form = useForm({
      defaultValues: { email: '' },
      onSubmit: ({ value }) => {
        seen.submitted = value
      }
    })
    seen.submit = () => form.handleSubmit()
    return createElement(
      'form',
      {
        onSubmit(event) {
          event.preventDefault()
          void form.handleSubmit()
        }
      },
      createElement(
        form.Field,
        {
          name: 'email',
          validators: {
            onBlur: ({ value }) => (value.trim() ? undefined : 'Enter an email.')
          }
        },
        field => {
          const message = field.state.meta.errors[0]
          return createElement(
            Field,
            { label: 'Email', error: typeof message === 'string' ? message : undefined },
            createElement(Input, {
              name: field.name,
              value: field.state.value,
              onBlur: () => field.handleBlur(),
              onChange: event => field.handleChange(event.target.value)
            })
          )
        }
      ),
      createElement('button', { type: 'button', onClick: () => form.reset() }, 'Reset')
    )
  }

  const { host, root } = mount()
  await act(async () => root.render(createElement(Reference)))
  const input = () => host.querySelector('input')
  await act(async () => blur(input()))
  assert.equal(host.querySelector('[data-slot="field-error"]')?.textContent, 'Enter an email.')

  await act(async () => typeInto(input(), 'ada@example.com'))
  await act(async () => blur(input()))
  assert.equal(input().value, 'ada@example.com')
  assert.equal(host.querySelector('[data-slot="field-error"]'), null)
  await act(async () => {
    await seen.submit()
  })
  assert.deepEqual(seen.submitted, { email: 'ada@example.com' })

  await act(async () => host.querySelector('button').click())
  assert.equal(input().value, '')
  root.unmount()
})

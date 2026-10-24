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
const { Radio, RadioGroup } = await import('../dist/library/index.js')

function mount() {
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  return { host, root }
}

function options() {
  return [
    createElement(Radio, { key: 'free', label: 'Free', value: 'free' }),
    createElement(Radio, { key: 'pro', label: 'Pro', value: 'pro' }),
    createElement(Radio, { key: 'retired', label: 'Retired', value: 'retired', disabled: true }),
    createElement(Radio, { key: 'team', label: 'Team', value: 'team' })
  ]
}

test('a default radio hydrates without putting the group name on the fieldset', async () => {
  const element = createElement(
    RadioGroup,
    { label: 'Plan', name: 'plan', defaultValue: 'pro' },
    options()
  )
  const html = renderToString(element)
  assert.match(html, /value="pro"/)
  assert.match(html, /checked/)
  assert.doesNotMatch(html, /role="radiogroup"/)
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
  const checked = [...root.querySelectorAll('input')].filter(input => input.checked)
  assert.deepEqual(
    checked.map(input => input.value),
    ['pro']
  )
})

test('choosing a radio submits that value, skips a disabled choice, and reset restores the default', async () => {
  const seen = { value: '', submitted: '' }
  function Form() {
    return createElement(
      'form',
      {
        onSubmit(event) {
          event.preventDefault()
          seen.submitted = new dom.window.FormData(event.currentTarget).get('plan') ?? ''
        }
      },
      createElement(
        RadioGroup,
        {
          label: 'Plan',
          name: 'plan',
          defaultValue: 'pro',
          onValueChange(value) {
            seen.value = value
          }
        },
        options()
      )
    )
  }

  const { host, root } = mount()
  await act(async () => root.render(createElement(Form)))
  const radios = [...host.querySelectorAll('input')]
  const retired = radios.find(input => input.value === 'retired')
  await act(async () => retired.closest('label').click())
  assert.equal(retired.checked, false)
  assert.equal(radios.find(input => input.value === 'pro').checked, true)
  const team = radios.find(input => input.value === 'team')
  await act(async () => team.closest('label').click())
  assert.equal(team.checked, true)
  assert.equal(radios.find(input => input.value === 'pro').checked, false)
  assert.equal(seen.value, 'team')
  await act(async () => {
    host
      .querySelector('form')
      .dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }))
  })
  assert.equal(seen.submitted, 'team')
  await act(async () => host.querySelector('form').reset())
  assert.equal(host.querySelector('input[value="pro"]').checked, true)
  assert.equal(host.querySelector('input[value="team"]').checked, false)
  root.unmount()
})

test('two groups with different names keep their own selection', async () => {
  function Form() {
    return createElement(
      'div',
      null,
      createElement(
        RadioGroup,
        { label: 'Plan', name: 'plan', defaultValue: 'pro' },
        createElement(Radio, { label: 'Pro', value: 'pro' }),
        createElement(Radio, { label: 'Team', value: 'team' })
      ),
      createElement(
        RadioGroup,
        { label: 'Seats', name: 'seats', defaultValue: '1' },
        createElement(Radio, { label: 'One', value: '1' }),
        createElement(Radio, { label: 'Many', value: 'many' })
      )
    )
  }

  const { host, root } = mount()
  await act(async () => root.render(createElement(Form)))
  await act(async () => host.querySelector('input[value="team"]').closest('label').click())
  assert.equal(host.querySelector('input[value="team"]').checked, true)
  assert.equal(host.querySelector('input[value="1"]').checked, true)
  root.unmount()
})

test('a controlled group keeps React state across a browser reset', async () => {
  function Controlled() {
    const [value, setValue] = useState('pro')
    return createElement(
      'form',
      null,
      createElement(
        RadioGroup,
        { label: 'Plan', name: 'plan', value, onValueChange: setValue },
        createElement(Radio, { label: 'Free', value: 'free' }),
        createElement(Radio, { label: 'Pro', value: 'pro' })
      )
    )
  }

  const { host, root } = mount()
  await act(async () => root.render(createElement(Controlled)))
  await act(async () => host.querySelector('input[value="free"]').closest('label').click())
  assert.equal(host.querySelector('input[value="free"]').checked, true)
  await act(async () => host.querySelector('form').reset())
  assert.equal(host.querySelector('input[value="free"]').checked, true)
  root.unmount()
})

test('a disabled group does not change the selection', async () => {
  const { host, root } = mount()
  await act(async () => {
    root.render(
      createElement(
        RadioGroup,
        { label: 'Plan', name: 'plan', defaultValue: 'pro', disabled: true },
        createElement(Radio, { label: 'Free', value: 'free' }),
        createElement(Radio, { label: 'Pro', value: 'pro' })
      )
    )
  })
  const fieldset = host.querySelector('fieldset')
  assert.equal(fieldset.disabled, true)
  await act(async () => host.querySelector('input[value="free"]').closest('label').click())
  assert.equal(host.querySelector('input[value="pro"]').checked, true)
  root.unmount()
})

test('a ref points at the radio input', async () => {
  const ref = createRef()
  const { host, root } = mount()
  await act(async () => {
    root.render(createElement(Radio, { label: 'Pro', name: 'plan', value: 'pro', ref }))
  })
  assert.equal(ref.current, host.querySelector('input'))
  assert.equal(ref.current.type, 'radio')
  root.unmount()
})

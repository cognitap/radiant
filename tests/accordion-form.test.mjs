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
  'HTMLDetailsElement',
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

const { act, createElement } = await import('react')
const { createRoot, hydrateRoot } = await import('react-dom/client')
const { renderToString } = await import('react-dom/server')
const { Accordion, AccordionContent, AccordionItem, AccordionTrigger, useAccordion } =
  await import('../dist/library/index.js')

function mount() {
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  return { host, root }
}

function item(value, label, content = `${label} details.`, props = {}) {
  return createElement(
    AccordionItem,
    { value, ...props },
    createElement(AccordionTrigger, null, label),
    createElement(
      AccordionContent,
      null,
      content,
      createElement('button', { type: 'button' }, 'Track')
    )
  )
}

function sections(props = {}) {
  return createElement(
    Accordion,
    props,
    item('shipping', 'Shipping', 'Ships in two days.'),
    item('returns', 'Returns', 'Returns are free for 30 days.')
  )
}

function opens(host) {
  return [...host.querySelectorAll('details')].map(details => details.open)
}

test('an accordion hydrates the default section from the open attribute', async () => {
  const html = renderToString(sections({ defaultValue: 'shipping' }))
  const tags = [...html.matchAll(/<details\b[^>]*>/g)].map(match => match[0])
  assert.equal(tags.length, 2)
  assert.match(tags[0], /\sopen=""/)
  assert.doesNotMatch(tags[1], /\sopen(?:=|\s|>)/)
  assert.match(html, /data-slot="accordion"/)
  assert.match(html, /data-type="single"/)
  assert.match(html, /<h3\b[^>]*>Shipping<\/h3>/)
  assert.doesNotMatch(html, /onValueChange|defaultValue/)

  const host = document.getElementById('root')
  host.innerHTML = html
  const recoverable = []
  let hydrated
  await act(async () => {
    hydrated = hydrateRoot(host, sections({ defaultValue: 'shipping' }), {
      onRecoverableError(error) {
        recoverable.push(String(error))
      }
    })
  })
  assert.deepEqual(recoverable, [])
  assert.deepEqual(opens(host), [true, false])
  await act(async () => hydrated.unmount())
})

test('opening a section closes the other section', async () => {
  const seen = []
  const { host, root } = mount()
  await act(async () =>
    root.render(
      sections({
        defaultValue: 'shipping',
        onValueChange(next) {
          seen.push(next)
        }
      })
    )
  )
  assert.deepEqual(opens(host), [true, false])
  await act(async () => host.querySelectorAll('summary')[1].click())
  assert.deepEqual(opens(host), [false, true])
  assert.deepEqual(seen, ['returns'])
  await act(async () => host.querySelectorAll('summary')[1].click())
  assert.deepEqual(opens(host), [false, false])
  assert.deepEqual(seen, ['returns', null])
  await act(async () => root.unmount())
})

test('multiple mode can keep two sections open', async () => {
  const { host, root } = mount()
  await act(async () => root.render(sections({ type: 'multiple', defaultValue: ['shipping'] })))
  await act(async () => host.querySelectorAll('summary')[1].click())
  assert.deepEqual(opens(host), [true, true])
  await act(async () => root.unmount())
})

test('a disabled section does not toggle', async () => {
  const seen = []
  const { host, root } = mount()
  await act(async () =>
    root.render(
      createElement(
        Accordion,
        {
          defaultValue: 'shipping',
          onValueChange(next) {
            seen.push(next)
          }
        },
        item('shipping', 'Shipping'),
        item('returns', 'Returns', 'Returns are free for 30 days.', { disabled: true })
      )
    )
  )
  const returns = host.querySelectorAll('details')[1]
  const summary = returns.querySelector('summary')
  assert.equal(summary.getAttribute('aria-disabled'), 'true')
  assert.equal(summary.getAttribute('tabindex'), '-1')
  await act(async () => summary.click())
  assert.equal(returns.open, false)
  assert.deepEqual(opens(host), [true, false])
  assert.deepEqual(seen, [])
  await act(async () => root.unmount())
})

test('a controlled accordion stays on its value when that value does not change', async () => {
  const seen = []
  const { host, root } = mount()
  await act(async () =>
    root.render(
      sections({
        value: 'shipping',
        onValueChange(next) {
          seen.push(next)
        }
      })
    )
  )
  await act(async () => host.querySelectorAll('summary')[1].click())
  assert.deepEqual(seen, ['returns'])
  assert.deepEqual(opens(host), [true, false])
  await act(async () => root.unmount())
})

test('a nested disclosure does not change the accordion selection', async () => {
  function Nested() {
    return createElement(
      Accordion,
      { defaultValue: 'account' },
      createElement(
        AccordionItem,
        { value: 'account' },
        createElement(AccordionTrigger, null, 'Account'),
        createElement(
          AccordionContent,
          null,
          createElement(
            'details',
            null,
            createElement('summary', null, 'Password'),
            'Use at least 10 characters.'
          )
        )
      )
    )
  }
  const { host, root } = mount()
  await act(async () => root.render(createElement(Nested)))
  const [outer, inner] = host.querySelectorAll('details')
  assert.equal(outer.open, true)
  await act(async () => inner.querySelector('summary').click())
  assert.equal(inner.open, true)
  assert.equal(outer.open, true)
  assert.equal(outer.getAttribute('data-state'), 'open')
  await act(async () => root.unmount())
})

test('closed accordion fields stay in the ancestor form', async () => {
  const seen = { note: '' }
  function Host() {
    return createElement(
      'form',
      {
        onSubmit(event) {
          event.preventDefault()
          seen.note = new dom.window.FormData(event.currentTarget).get('note') ?? ''
        }
      },
      createElement(
        Accordion,
        null,
        createElement(
          AccordionItem,
          { value: 'note' },
          createElement(AccordionTrigger, null, 'Note'),
          createElement(
            AccordionContent,
            null,
            createElement('input', { name: 'note', defaultValue: 'hello' })
          )
        )
      )
    )
  }
  const { host, root } = mount()
  await act(async () => root.render(createElement(Host)))
  assert.equal(host.querySelector('details').open, false)
  await act(async () => {
    host
      .querySelector('form')
      .dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }))
  })
  assert.equal(seen.note, 'hello')
  await act(async () => root.unmount())
})

test('useAccordion can open a section', async () => {
  function Custom() {
    const accordion = useAccordion()
    return createElement(
      'button',
      { type: 'button', onClick: () => accordion?.setItemOpen('shipping', true) },
      'Custom'
    )
  }
  const { host, root } = mount()
  await act(async () =>
    root.render(createElement(Accordion, null, createElement(Custom), item('shipping', 'Shipping')))
  )
  assert.equal(host.querySelector('details').open, false)
  await act(async () => host.querySelector('button').click())
  assert.equal(host.querySelector('details').open, true)
  await act(async () => root.unmount())
})

test('a trigger can omit the heading', async () => {
  const html = renderToString(
    createElement(
      Accordion,
      { defaultValue: null },
      createElement(
        AccordionItem,
        { value: 'shipping' },
        createElement(AccordionTrigger, { level: null }, 'Shipping'),
        createElement(AccordionContent, null, 'Ships in two days.')
      )
    )
  )
  assert.doesNotMatch(html, /<h3\b/)
  assert.match(html, /<summary\b[^>]*>[\s\S]*Shipping/)
})

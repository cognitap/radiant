import { afterEach, expect, test } from 'vitest'
import '../../.storybook/styles.css'

const hosts: HTMLElement[] = []
afterEach(() => {
  for (const host of hosts.splice(0)) host.remove()
})
function prose(html: string, slot?: string) {
  const host = document.createElement('div')
  host.setAttribute('data-rad-prose', '')
  if (slot) host.setAttribute('data-slot', slot)
  host.innerHTML = html
  document.body.append(host)
  hosts.push(host)
  const node = (id: string) => host.querySelector<HTMLElement>(`#${id}`)!
  const style = (id: string) => getComputedStyle(node(id))
  const size = (element: Element) => parseFloat(getComputedStyle(element).fontSize)
  return {
    style,
    /** List indent in ems of the list's own font size. */
    indent: (id: string) => parseFloat(style(id).paddingInlineStart) / size(node(id)),
    /** Code size relative to the text around it. */
    scale: (id: string) => size(node(id)) / size(node(id).parentElement!)
  }
}

test('a text role keeps prose list indent and code scrolling; opted-out children keep their own', () => {
  const { style, indent } = prose(`
    <ul id="list"><li>One</li></ul>
    <ul id="role-list" data-rad-text="ui-body"><li>One</li></ul>
    <ul id="slot-list" data-slot="menu"><li>One</li></ul>
    <ul id="plain-list" data-rad-not-prose><li>One</li></ul>
    <pre id="pre"><code>one</code></pre>
    <pre id="role-pre" data-rad-text="ui-body"><code id="role-pre-code">one</code></pre>
    <pre id="slot-pre" data-slot="code-block-content"><code>one</code></pre>
    <pre id="plain-pre" data-rad-not-prose><code>one</code></pre>
  `)
  expect(indent('list')).toBeCloseTo(1.25)
  expect(indent('role-list')).toBeCloseTo(1.25)
  expect(indent('slot-list')).not.toBeCloseTo(1.25)
  expect(indent('plain-list')).not.toBeCloseTo(1.25)
  expect(style('pre').overflowX).toBe('auto')
  expect(style('role-pre').overflowX).toBe('auto')
  expect(style('role-pre-code').fontFamily).toBe(style('role-pre').fontFamily)
  expect(style('slot-pre').overflowX).toBe('visible')
  expect(style('plain-pre').overflowX).toBe('visible')
})

test('inline code styling stops at opted-out elements and resumes in nested prose', () => {
  const { scale } = prose(`
    <p><code id="code">one</code></p>
    <p><code id="slot-code" data-slot="inline-code">one</code></p>
    <p data-rad-not-prose><code id="plain-block-code">one</code></p>
    <p><span data-rad-not-prose><code id="plain-nested-code">one</code></span></p>
    <p><span data-slot="badge"><code id="slot-nested-code">one</code></span></p>
    <div data-slot="card">
      <div data-rad-prose><p><code id="nested-prose-code">one</code></p></div>
    </div>
  `)
  expect(scale('code')).toBeCloseTo(0.9)
  expect(scale('nested-prose-code')).toBeCloseTo(0.9)
  for (const id of ['slot-code', 'plain-block-code', 'plain-nested-code', 'slot-nested-code'])
    expect(scale(id), id).not.toBeCloseTo(0.9)
})

test('a component host that is itself prose styles its inline code', () => {
  const { scale } = prose('<p><code id="code">one</code></p>', 'card-content')
  expect(scale('code')).toBeCloseTo(0.9)
})

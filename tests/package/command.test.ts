import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup as render } from 'react-dom/server'
import {
  Command,
  CommandTrigger,
  CommandContent,
  CommandTitle,
  CommandDescription,
  CommandInput,
  CommandList,
  CommandClose,
  Field,
  Combobox
} from '@cognitap/radiant'
const items = [
  { value: 'new', label: 'Create project', group: 'Projects', shortcut: ['Ctrl', 'N'] },
  { value: 'settings', label: 'Open settings', group: 'Navigation' }
]
function tree(props = {}) {
  return h(
    Command,
    { items, onAction: () => {}, ...props },
    h(CommandTrigger, {}, 'Commands'),
    h(
      CommandContent,
      {},
      h(CommandTitle, {}, 'Workspace'),
      h(CommandDescription, {}, 'Find an action'),
      h(CommandInput),
      h(CommandList),
      h(CommandClose, {}, 'Close')
    )
  )
}
test('Command server markup shares native Dialog and Combobox hosts, groups and Kbd without global bindings or form carriers', () => {
  const html = render(
    h(
      Field,
      { label: 'Outer', required: true, disabled: true },
      tree({ defaultOpen: true, defaultQuery: 'project' })
    )
  )
  assert.match(html, /<dialog[^>]+data-slot="dialog command"/)
  assert.doesNotMatch(html.match(/<dialog[^>]*>/)![0], /\sopen(?:=|\s|>)/)
  assert.match(html, /data-slot="combobox-input command-input"/)
  assert.match(html, /data-slot="button dialog-trigger command-trigger"/)
  assert.match(html, /role="group" aria-label="Projects"/)
  assert.match(html, /<kbd[^>]+data-slot="kbd kbd-group"/)
  assert.match(html, /value="project"/)
  assert.equal((html.match(/<input /g) ?? []).length, 1)
  assert.doesNotMatch(html, /<input[^>]+(?:name|form|required|disabled)=|combobox-native|popover=/)
})
test('Command rejects conflicting owners and malformed registries, and guards real specialized parts', () => {
  for (const props of [
    { query: 'a', defaultQuery: 'b' },
    { open: true, defaultOpen: false },
    { query: 42 },
    { defaultQuery: null },
    { items: [items[0], items[0]] }
  ])
    assert.throws(() => render(tree(JSON.parse(JSON.stringify(props)))))
  assert.throws(() => render(h(CommandInput)), /inside Command/)
  assert.throws(
    () => render(h(Command, { items, onAction: () => {} }, h(CommandInput, { 'aria-label': ' ' }))),
    /requires aria-label/
  )
  assert.throws(() => render(h(Combobox, { items }, h(CommandList))), /inside Command/)
})

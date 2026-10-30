import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup as render } from 'react-dom/server'
import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateTitle,
  EmptyStateDescription,
  EmptyStateActions,
  Button,
  Link,
  CardTitle,
  AlertTitle,
  Combobox,
  ComboboxInput,
  ComboboxContent,
  Command,
  CommandContent,
  CommandTitle,
  CommandDescription,
  CommandInput,
  CommandList
} from '@cognitap/radiant'
const message = h(
  EmptyState,
  { variant: 'no-results' },
  h(EmptyStateTitle, { level: 3 }, 'No matching records'),
  h(EmptyStateDescription, {}, 'Clear the search.')
)
test('EmptyState keeps passive native hosts, explicit heading levels, real actions and protected decorative identity', () => {
  const html = render(
    h(
      EmptyState,
      {
        variant: 'error',
        tone: 'danger',
        'data-slot': 'custom',
        className: 'custom-root',
        style: { padding: '21px' },
        ref: () => {
          throw Error('SSR ref')
        }
      },
      h(EmptyStateIcon, {}, h('svg', { 'aria-label': 'Decorative search mark' })),
      h(EmptyStateTitle, { level: 4 }, 'No reports'),
      h(EmptyStateDescription, {}, 'Try again.'),
      h(EmptyStateActions, {}, h(Button, {}, 'Retry'), h(Link, { href: '/help' }, 'Help'))
    )
  )
  assert.match(html, /data-slot="empty-state custom"/)
  assert.match(html, /data-variant="error"/)
  assert.match(html, /data-tone="danger"/)
  assert.match(html, /style="padding:21px"/)
  assert.match(html, /<h4[^>]+data-slot="empty-state-title"/)
  assert.match(html, /<span[^>]+aria-hidden="true"[^>]+data-slot="empty-state-icon"/)
  assert.match(html, /<button[^>]+type="button"/)
  assert.match(html, /<a[^>]+href="\/help"/)
  assert.doesNotMatch(html, /role="(?:alert|status)"|aria-live=/)
})
test('native heading policy remains compatible across presentation families and all empty variants render without a state owner', () => {
  for (const level of [1, 2, 3, 4, 5, 6] as const)
    for (const Title of [EmptyStateTitle, CardTitle, AlertTitle])
      assert.match(render(h(Title, { level }, 'Heading')), new RegExp('<h' + level + '\\b'))
  for (const variant of ['first-use', 'no-results', 'error'] as const)
    assert.match(
      render(h(EmptyState, { variant }, message)),
      new RegExp('data-variant="' + variant + '"')
    )
})
test('rich empty content stays outside the actual Combobox and Command listboxes on the server', () => {
  const items: { value: string; label: string }[] = []
  const box = render(
    h(
      Combobox,
      { items, defaultOpen: true, emptyText: message },
      h(ComboboxInput, { 'aria-label': 'Search' }),
      h(ComboboxContent)
    )
  )
  assert.match(box, /<div[^>]+role="listbox"[^>]*><\/div><div[^>]+role="status"/)
  assert.match(box, /No matching records/)
  const command = render(
    h(
      Command,
      { items, defaultOpen: true, emptyText: message, onAction: () => {} },
      h(
        CommandContent,
        {},
        h(CommandTitle, {}, 'Commands'),
        h(CommandDescription, {}, 'Search actions'),
        h(CommandInput),
        h(CommandList)
      )
    )
  )
  assert.match(command, /<div[^>]+role="listbox"[^>]*><\/div><div[^>]+role="status"/)
  assert.match(command, /No matching records/)
})

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup as render } from 'react-dom/server'
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuContent,
  NavigationMenuViewport,
  useNavigationMenu,
  ThemeScope,
  defineTheme
} from '@cognitap/radiant'
const items = [{ value: 'learn' }, { value: 'about' }]
function sample(props: Record<string, unknown> = {}) {
  return h(
    NavigationMenu,
    { 'aria-label': 'Project', items, ...props },
    h(
      NavigationMenuList,
      null,
      h(NavigationMenuItem, null, h(NavigationMenuTrigger, { value: 'learn' }, 'Learn')),
      h(NavigationMenuItem, null, h(NavigationMenuTrigger, { value: 'about' }, 'About'))
    ),
    h(
      NavigationMenuViewport,
      null,
      h(
        NavigationMenuContent,
        { value: 'learn' },
        h(NavigationMenuLink, { href: '/guide', active: true }, 'Guide')
      ),
      h(NavigationMenuContent, { value: 'about' }, h(NavigationMenuLink, { href: '/team' }, 'Team'))
    )
  )
}
test('NavigationMenu SSR retains native navigation, list, Button, Link and ScrollArea identities without menu roles', () => {
  const html = render(sample())
  assert.match(html, /<nav[^>]+aria-label="Project"/)
  assert.match(html, /<ul[^>]+data-slot="navigation-menu-list"/)
  assert.match(html, /<li[^>]+data-slot="navigation-menu-item"/)
  assert.match(html, /<button[^>]+aria-expanded="false"/)
  assert.match(html, /data-slot="button navigation-menu-trigger"/)
  assert.match(html, /data-slot="link navigation-menu-link"/)
  assert.match(html, /data-slot="scroll-area navigation-menu-viewport"/)
  assert.match(html, /href="\/guide"/)
  assert.match(html, /aria-current="page"/)
  assert.doesNotMatch(html, /role="(?:menu|menubar|menuitem)"/)
  const ids = [...html.matchAll(/aria-controls="([^"]+)"/g)].map(match => match[1])
  assert.equal(ids.length, 2)
  for (const id of ids) assert.ok(html.includes(`id="${id}"`))
  assert.match(html, /hidden="" inert=""[^>]+data-slot="navigation-menu-content"/)
})
test('a single initial owner controls the visible SSR panel and private state hooks are absent outside roots', () => {
  const html = render(sample({ defaultValue: 'learn' }))
  assert.match(html, /aria-expanded="true"/)
  assert.match(html, /data-slot="navigation-menu-content" data-state="open"/)
  assert.equal(
    (html.match(/data-slot="navigation-menu-content" data-state="open"/g) || []).length,
    1
  )
  function Hook() {
    assert.equal(useNavigationMenu(), null)
    return null
  }
  render(h(Hook))
  for (const props of [
    { value: 'learn', defaultValue: 'learn' },
    { value: 'missing' },
    { openDelay: -1 },
    { closeDelay: Infinity },
    { items: [{ value: 'a' }, { value: 'a' }] },
    { 'aria-label': ' ' }
  ])
    assert.throws(() => render(sample(props)))
  assert.throws(
    () => render(h(NavigationMenuTrigger, { value: 'learn' }, 'Learn')),
    /inside NavigationMenu/
  )
  assert.throws(() => render(h(NavigationMenuContent, { value: 'learn' })), /inside NavigationMenu/)
})
test('theme slots remain independently typed and native viewport caller classes replace owned utility metrics', () => {
  const html = render(
    h(
      ThemeScope,
      {
        theme: defineTheme({
          id: 'nav',
          name: 'Nav',
          components: {
            navigationMenu: {
              gap: '11px',
              padding: '17px',
              radius: '13px',
              borderWidth: '3px',
              borderColor: 'red',
              background: 'white',
              color: 'black',
              shadow: 'none'
            }
          }
        })
      },
      sample()
    )
  )
  for (const [name, value] of [
    ['gap', '11px'],
    ['padding', '17px'],
    ['radius', '13px'],
    ['border-width', '3px'],
    ['border-color', 'red']
  ])
    assert.ok(html.includes(`--rad-navigation-menu-${name}:${value}`))
  const styled = render(
    h(
      NavigationMenu,
      { 'aria-label': 'Test', items },
      h(NavigationMenuViewport, { className: 'w-48 h-32 rounded-none border-0 p-0 shadow-none' })
    )
  )
  assert.match(styled, /w-48/)
  assert.doesNotMatch(styled, /w-\[var\(--_rad-indicator-width/)
})

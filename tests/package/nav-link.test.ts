import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup as render } from 'react-dom/server'
import {
  NavLink,
  NavLinkGroup,
  NavLinkGroupTrigger,
  NavLinkGroupContent,
  ThemeScope,
  defineTheme
} from '@cognitap/radiant'
test('NavLink keeps real Link identity, native external defaults and its active-page owner through render', () => {
  const html = render(
    h(
      NavLink,
      {
        children: 'Label',
        href: '/study',
        active: true,
        external: true,
        'data-slot': 'custom',
        render: props => h('a', { ...props, 'data-adapter': 'yes' }),
        icon: h('svg'),
        description: 'Study health',
        style: { color: 'red' },
        parts: { label: { className: 'label' } }
      },
      'Overview'
    )
  )
  assert.match(html, /<a /)
  assert.match(html, /data-slot="link nav-link custom"/)
  assert.match(html, /aria-current="page"/)
  assert.match(html, /href="\/study"/)
  assert.match(html, /target="_blank"/)
  assert.match(html, /rel="noopener noreferrer"/)
  assert.match(html, /data-adapter="yes"/)
  assert.match(html, /aria-hidden="true"/)
  assert.match(html, /style="color:red"/)
  const protectedHtml = render(
    h(
      NavLink,
      {
        ...JSON.parse('{"aria-current":"step","role":"menuitem"}'),
        children: 'Label',
        href: '/study'
      },
      'Overview'
    )
  )
  assert.doesNotMatch(protectedHtml, /aria-current=|role=/)
  assert.throws(
    () => render(h(NavLink, { children: 'Label', href: '/x', active: JSON.parse('"yes"') }, 'X')),
    /active must be boolean/
  )
  assert.throws(
    () => render(h(NavLink, { children: 'Label', href: '/x', render: () => h('button') }, 'X')),
    /anchor/
  )
})
test('NavLink uses native visible text naming and preserves caller descriptions and explicit names', () => {
  const html = render(
    h(NavLink, {
      href: '/study',
      children: 'Overview',
      description: 'Study health',
      'aria-describedby': 'help'
    })
  )
  assert.match(html, /aria-describedby="help"/)
  assert.match(html, /Overview/)
  assert.match(html, /Study health/)
  assert.doesNotMatch(html, /aria-labelledby=|aria-label=/)
  const named = render(
    h(NavLink, {
      href: '/study',
      children: 'Overview',
      'aria-label': 'Study overview',
      description: 'Study health'
    })
  )
  assert.match(named, /aria-label="Study overview"/)
})
test('NavLink nesting composes native Collapsible hosts and protects disclosure semantics', () => {
  const html = render(
    h(
      NavLinkGroup,
      { defaultOpen: true },
      h(
        NavLinkGroupTrigger,
        {
          ...JSON.parse('{"role":"menuitem","aria-expanded":false,"aria-current":"page"}'),
          description: 'All projects'
        },
        'Projects'
      ),
      h(NavLinkGroupContent, {}, h(NavLink, { children: 'Label', href: '/project' }, 'Project'))
    )
  )
  assert.match(html, /<details /)
  assert.match(html, /open=""/)
  assert.match(html, /<summary /)
  assert.match(html, /data-slot="collapsible nav-link-group"/)
  assert.match(html, /data-slot="collapsible-trigger nav-link-group-trigger"/)
  assert.match(html, /data-slot="collapsible-content nav-link-group-content"/)
  assert.doesNotMatch(html, /role=|aria-expanded=|aria-current=|aria-controls=/)
  assert.throws(
    () => render(h(NavLinkGroup, JSON.parse('{"open":true,"defaultOpen":false}'))),
    /both/
  )
  assert.throws(
    () => render(h(NavLinkGroupTrigger, { children: 'Projects' })),
    /inside Collapsible/
  )
})
test('NavLink has typed local theme overrides without changing Link tokens', () => {
  const html = render(
    h(
      ThemeScope,
      {
        theme: defineTheme({
          id: 'nav',
          name: 'Navigation',
          components: {
            navLink: { gap: '9px', indent: '17px', activeBackground: 'navy', activeColor: 'white' }
          }
        })
      },
      h(NavLink, { children: 'Label', href: '/study', active: true }, 'Overview')
    )
  )
  assert.match(html, /--rad-nav-link-gap:9px/)
  assert.match(html, /--rad-nav-link-indent:17px/)
  assert.doesNotMatch(html, /--rad-link-gap:/)
})

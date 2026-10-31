import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup as render } from 'react-dom/server'
import {
  AppShell,
  AppShellHeader,
  AppShellMain,
  AppShellSkipLink,
  Sidebar,
  SidebarTrigger,
  SidebarLabel,
  SidebarContent,
  NavLink,
  useAppShell,
  useSidebar,
  ThemeScope,
  defineTheme
} from '@cognitap/radiant'
function sample(props: Record<string, unknown> = {}) {
  return h(
    AppShell,
    props,
    h(AppShellSkipLink, null, 'Skip to content'),
    h(AppShellHeader, null, h(SidebarTrigger, null, 'Navigation')),
    h(
      Sidebar,
      { label: 'Projects' },
      h(
        SidebarContent,
        { expandedOnly: true },
        h('input', { 'aria-label': 'Project search', defaultValue: 'Atlas' })
      ),
      h(NavLink, { href: '/atlas', children: h(SidebarLabel, null, 'Atlas') })
    ),
    h(AppShellMain, null, h('h1', null, 'Research workspace'))
  )
}
test('AppShell SSR keeps native banner/navigation/main landmarks, named real links and one native navigation tree', () => {
  const html = render(sample({ mainId: 'workspace-main', sidebarId: 'workspace-nav' }))
  assert.match(html, /<header[^>]+role="banner"/)
  assert.match(html, /<nav[^>]+role="navigation"[^>]+id="workspace-nav"/)
  assert.match(html, /<main[^>]+id="workspace-main"[^>]+role="main"[^>]+tabindex="-1"/)
  assert.match(html, /data-slot="link app-shell-skip-link"/)
  assert.match(html, /href="#workspace-main"/)
  assert.match(html, /aria-controls="workspace-nav"/)
  assert.equal((html.match(/<nav\b/g) || []).length, 1)
  assert.match(html, /data-slot="button sidebar-trigger"/)
  assert.match(html, /data-slot="dialog drawer"/)
  assert.doesNotMatch(html, /<dialog[^>]+open=/)
  const labelled = html.match(/<nav[^>]+aria-labelledby="([^"]+)"/)?.[1]
  assert.ok(labelled && html.includes(`id="${labelled}"`))
})
test('collapsed SSR retains native descendants while hiding only expanded content and keeping labels available to assistive technology', () => {
  const html = render(sample({ defaultCollapsed: true }))
  assert.match(html, /aria-expanded="false"/)
  assert.match(html, /hidden="" inert=""[^>]+data-slot="sidebar-content"/)
  assert.match(html, /value="Atlas"/)
  assert.match(html, /data-slot="sidebar-item-label" class="sr-only"/)
  assert.doesNotMatch(html, /aria-pressed=/)
})
test('owners and named parts reject contradictory or invalid layouts, and hooks are null outside their application', () => {
  for (const props of [
    { collapsed: true, defaultCollapsed: false },
    { open: true, defaultOpen: false },
    { collapsed: 'yes' },
    { mainId: 'invalid id' }
  ])
    assert.throws(() => render(sample(props)), TypeError)
  assert.throws(() => render(h(Sidebar, { label: 'Project' })), /inside AppShell/)
  assert.throws(() => render(h(AppShell, null, h(Sidebar, { label: ' ' }))), /labels/)
  function Outside() {
    assert.equal(useAppShell(), null)
    assert.equal(useSidebar(), null)
    return null
  }
  render(h(Outside))
})
test('theme scopes expose independent typed app frame and sidebar roles without introducing a form or persistence owner', () => {
  const html = render(
    h(
      ThemeScope,
      {
        theme: defineTheme({
          id: 'research-shell',
          name: 'Research shell',
          components: {
            appShell: { headerPadding: '19px', mainPadding: '23px', background: 'black' },
            sidebar: {
              width: '18rem',
              collapsedWidth: '6rem',
              background: 'white',
              labelSize: '18px'
            }
          }
        })
      },
      sample()
    )
  )
  for (const variable of [
    '--rad-app-shell-header-padding:19px',
    '--rad-app-shell-main-padding:23px',
    '--rad-sidebar-width:18rem',
    '--rad-sidebar-collapsed-width:6rem'
  ])
    assert.ok(html.includes(variable))
  assert.doesNotMatch(html, /<form|type="hidden"|localStorage/)
})

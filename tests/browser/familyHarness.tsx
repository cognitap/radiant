import { act, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, vi } from 'vitest'
import { userEvent, commands } from 'vitest/browser'
import '../../.storybook/styles.css'
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const mounted: { host: HTMLDivElement; root: Root }[] = []
export async function mount(tree: ReactNode, hydrate = false) {
  const host = document.createElement('div')
  document.body.append(host)
  if (hydrate) host.innerHTML = renderToString(tree)
  const errors: unknown[] = []
  let root!: Root
  await act(async () => {
    root = hydrate
      ? hydrateRoot(host, tree, { onRecoverableError: e => errors.push(e) })
      : createRoot(host)
    if (!hydrate) root.render(tree)
  })
  mounted.push({ host, root })
  expect(errors).toEqual([])
  return { host, render: (next: ReactNode) => act(async () => root.render(next)) }
}
afterEach(async () => {
  for (const { host, root } of mounted.splice(0)) {
    await act(async () => root.unmount())
    host.remove()
  }
  await commands.emulatePreferences({ reducedMotion: 'no-preference', forcedColors: 'none' })
})
export const click = (node: HTMLElement) => act(async () => userEvent.click(node))
export const key = (keys: string) => act(async () => userEvent.keyboard(keys))
export const shown = (node: HTMLElement) => node.matches(':popover-open')
export const pause = (ms: number) =>
  act(async () => {
    await new Promise(resolve => setTimeout(resolve, ms))
  })

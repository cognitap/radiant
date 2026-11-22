import { act } from 'react'
import { expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import {
  A2uiSurface,
  validateA2uiAccessibility,
  type A2uiActionPayload,
  type A2uiMessage,
  type A2uiSurfaceLabels,
  type CatalogDiagnostic
} from '../../src/a2ui/index.js'
import {
  dragAndDropFixtureMessages,
  EXTENSION_SURFACE_ID
} from '../../src/a2ui/extensionFixtures.js'
import { key, mount } from './familyHarness.js'

const labels: A2uiSurfaceLabels = {
  dragDropInstructions: 'Space picks up, Left and Right change folder, Space drops.',
  dragDropPickUp: 'Picked up {item} in {from}.',
  dragDropMove: move => `${move.item} over ${move.to}, ${move.index + 1} of ${move.count}.`,
  dragDropDrop: 'Moved {item} from {from} to {to}, {position} of {count}.',
  dragDropCancel: 'Cancelled {item}.',
  dragDropFull: '{to} is full.',
  dragDropHandle: 'Move {item}'
}

async function render(messages: readonly A2uiMessage[], surfaceLabels?: A2uiSurfaceLabels) {
  const diagnostics: CatalogDiagnostic[] = []
  const onAction = vi.fn<(event: A2uiActionPayload) => void>()
  const view = await mount(
    <A2uiSurface
      surfaceId={EXTENSION_SURFACE_ID}
      messages={messages}
      onAction={onAction}
      onDiagnostic={d => diagnostics.push(d)}
      labels={surfaceLabels}
    />
  )
  return { ...view, diagnostics, onAction }
}
const handle = (host: HTMLElement, name: string) =>
  Array.from(host.querySelectorAll<HTMLButtonElement>('[data-slot~="drag-and-drop-handle"]')).find(
    node => node.getAttribute('aria-label') === name
  )!
const announced = (host: HTMLElement, message: string) =>
  act(async () => {
    await vi.waitFor(
      () =>
        expect(host.querySelector('[data-slot="drag-and-drop-status"]')!.textContent).toBe(message),
      { timeout: 2_000 }
    )
  })
const folders = (host: HTMLElement) =>
  Object.fromEntries(
    Array.from(host.querySelectorAll('[data-slot~="drag-and-drop-container"]'), node => [
      node.querySelector('[data-slot="drag-and-drop-container-label"]')!.textContent,
      Array.from(
        node.querySelectorAll('[data-slot~="drag-and-drop-item-content"]'),
        item => item.textContent
      )
    ])
  )

test('DragAndDrop follows its bound value, writes moves back and enforces capacity', async () => {
  const { host, onAction } = await render(dragAndDropFixtureMessages, labels)
  const legend = host.querySelector('legend')!
  expect(legend.textContent).toContain('Sort files')
  expect(host.querySelector('[data-slot~="drag-and-drop"]')!.getAttribute('aria-labelledby')).toBe(
    legend.id
  )
  expect(folders(host)).toEqual({
    Inbox: ['Invoice.pdf', 'Beach.jpg', 'Notes.txt'],
    Work: [],
    Personal: []
  })
  for (const file of ['Invoice.pdf', 'Beach.jpg']) {
    await act(async () => handle(host, `Move ${file}`).focus())
    await key(' {ArrowRight} ')
  }
  await announced(host, 'Moved Beach.jpg from Inbox to Work, 2 of 2.')
  expect(folders(host).Work).toEqual(['Invoice.pdf', 'Beach.jpg'])
  await act(async () => handle(host, 'Move Notes.txt').focus())
  await key(' {ArrowRight} ')
  await announced(host, 'Work is full.')
  await key('{ArrowRight}')
  await announced(host, 'Notes.txt over Personal, 1 of 1.')
  await key(' ')
  await act(async () => {
    await userEvent.click(
      Array.from(host.querySelectorAll('button')).find(b => b.textContent === 'Save')!
    )
  })
  expect(onAction.mock.calls.at(-1)?.[0].context).toEqual({
    value: { inbox: [], work: ['invoice', 'photo'], personal: ['notes'] }
  })
})

test('DragAndDrop shows static containers without host labels', async () => {
  const plain = await render(dragAndDropFixtureMessages)
  expect(plain.host.querySelector('[data-slot~="drag-and-drop-handle"]')).toBeNull()
  const sections = plain.host.querySelectorAll('[data-slot="a2ui-drag-and-drop-container"]')
  expect(Array.from(sections, node => node.firstElementChild!.textContent)).toEqual([
    'Inbox',
    'Work',
    'Personal'
  ])
  expect(Array.from(sections[0]!.querySelectorAll('li'), node => node.textContent)).toEqual([
    'Invoice.pdf',
    'Beach.jpg',
    'Notes.txt'
  ])
  await vi.waitFor(() =>
    expect(plain.diagnostics).toContainEqual(
      expect.objectContaining({ kind: 'defaulted', component: 'DragAndDrop', nodeId: 'control' })
    )
  )
  // A container with a capacity also needs the full text.
  const { dragDropFull: _full, ...rest } = labels
  const capped = await render(dragAndDropFixtureMessages, rest)
  expect(capped.host.querySelector('[data-slot~="drag-and-drop-handle"]')).toBeNull()
  await vi.waitFor(() =>
    expect(capped.diagnostics).toContainEqual(
      expect.objectContaining({ kind: 'defaulted', component: 'DragAndDrop' })
    )
  )
})

test('DragAndDrop needs a label', () => {
  const messages = structuredClone(dragAndDropFixtureMessages) as A2uiMessage[]
  const control = (
    messages[0] as { createSurface: { components: Record<string, unknown>[] } }
  ).createSurface.components.find(c => c.id === 'control')!
  expect(validateA2uiAccessibility(messages).errors).toEqual([])
  control.label = ' '
  expect(validateA2uiAccessibility(messages).errors.map(error => error.component)).toContain(
    'DragAndDrop'
  )
})

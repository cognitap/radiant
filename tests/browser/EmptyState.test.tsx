import { createRef, StrictMode, act } from 'react'
import { expect, test } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateTitle,
  EmptyStateDescription,
  EmptyStateActions,
  Button,
  ThemeScope,
  defineTheme
} from '../../src/index.js'
import {
  CreateStudyProject,
  FindStudyProject,
  RecoverStudyReports
} from '../../.storybook/examples/EmptyStateExamples.js'
import { mount, click, key, pause } from './familyHarness.js'
test('passive hosts hydrate with real refs, chosen headings, theme slots and caller styles without implicit urgency', async () => {
  const root = createRef<HTMLDivElement>(),
    title = createRef<HTMLHeadingElement>(),
    icon = createRef<HTMLSpanElement>()
  const { host } = await mount(
    <StrictMode>
      <ThemeScope
        theme={defineTheme({
          id: 'empty-test',
          name: 'Empty test',
          components: {
            emptyState: {
              iconSize: '30px',
              titleSize: '22px',
              actionsGap: '17px',
              borderWidth: '3px'
            }
          }
        })}
      >
        <EmptyState
          ref={root}
          variant="error"
          tone="neutral"
          data-slot="custom"
          className="custom-root"
          style={{ padding: '12px', borderRadius: '19px' }}
          dir="rtl"
        >
          <EmptyStateIcon ref={icon}>
            <svg />
          </EmptyStateIcon>
          <EmptyStateTitle
            ref={title}
            level={4}
          >
            No records
          </EmptyStateTitle>
          <EmptyStateDescription>Try another filter.</EmptyStateDescription>
          <EmptyStateActions>
            <Button>Clear</Button>
          </EmptyStateActions>
        </EmptyState>
        <EmptyState
          variant="no-results"
          data-testid="empty-boundary"
        >
          <EmptyStateTitle level={4}>No matching records</EmptyStateTitle>
        </EmptyState>
      </ThemeScope>
    </StrictMode>,
    true
  )
  expect(root.current).toBe(host.querySelector('[data-slot~="empty-state"]'))
  expect(title.current?.tagName).toBe('H4')
  expect(root.current!.getAttribute('role')).toBeNull()
  expect(root.current!.getAttribute('aria-live')).toBeNull()
  expect(icon.current!.getAttribute('aria-hidden')).toBe('true')
  expect(getComputedStyle(icon.current!).width).toBe('30px')
  expect(getComputedStyle(icon.current!).color).toBe(getComputedStyle(root.current!).color)
  expect(getComputedStyle(title.current!).fontSize).toBe('22px')
  expect(getComputedStyle(root.current!).borderRadius).toBe('19px')
  expect(getComputedStyle(root.current!).padding).toBe('12px')
  expect(
    getComputedStyle(host.querySelector('[data-testid="empty-boundary"]')!).borderTopWidth
  ).toBe('3px')
  expect(getComputedStyle(root.current!).direction).toBe('rtl')
  expect(root.current!.dataset.slot).toBe('empty-state custom')
  expect(getComputedStyle(host.querySelector('[data-slot="empty-state-actions"]')!).gap).toBe(
    '17px'
  )
})
test('Table first use creates a native record, focuses its action and opens actual details', async () => {
  const { host } = await mount(<CreateStudyProject />)
  expect(host.querySelector('td')!.colSpan).toBe(3)
  await click(host.querySelector('button')!)
  expect(host.querySelector('[data-slot="empty-state"]')).toBeNull()
  const open = host.querySelector('button')!
  expect(open.textContent).toBe('Open Reader study')
  expect(document.activeElement).toBe(open)
  expect(host.querySelector('tbody')!.textContent).toContain('Reader study')
  await key('{Enter}')
  expect(host.querySelector('[aria-label="Project details"] h3')!.textContent).toBe('Reader study')
  expect(document.activeElement).toBe(host.querySelector('[aria-label="Project details"] h3'))
  await click(open)
  expect(document.activeElement).toBe(host.querySelector('[aria-label="Project details"] h3'))
})
test('Combobox empty content is status outside the listbox; Tab reaches the external clear action and native selection submits a key', async () => {
  const { host } = await mount(<FindStudyProject />),
    input = host.querySelector('input')!
  await act(async () => userEvent.fill(input, 'Missing'))
  const empty = host.querySelector('[data-slot="empty-state"]')!,
    list = host.querySelector('[role="listbox"]')!
  expect(empty).not.toBeNull()
  expect(list.contains(empty)).toBe(false)
  expect(empty.closest('[role="status"]')).not.toBeNull()
  await key('{Tab}')
  const clear = [...host.querySelectorAll('button')].find(
    button => button.textContent === 'Clear search'
  )!
  expect(document.activeElement).toBe(clear)
  await key('{Enter}')
  expect(document.activeElement).toBe(input)
  await key('{ArrowDown}{Enter}')
  expect(new FormData(host.querySelector('form')!).get('project')).toBe('reader')
  await click(host.querySelector('button[type="submit"]')!)
  expect(host.querySelector('[aria-label="Selected project"] h3')!.textContent).toBe('Reader study')
})
test('Command recovery remains keyboard reachable in short modal bounds, preserves query and waits for explicit activation', async () => {
  await commands.emulatePreferences({ forcedColors: 'active', reducedMotion: 'reduce' })
  const { host } = await mount(
    <RecoverStudyReports
      dir="rtl"
      level={4}
    />
  )
  await click(host.querySelector('button')!)
  const dialog = host.querySelector('dialog')!,
    input = host.querySelector('input')!,
    empty = host.querySelector('[data-slot="empty-state"]')!
  expect(empty.closest('[role="status"]')).not.toBeNull()
  expect(host.querySelector('[role="listbox"]')!.contains(empty)).toBe(false)
  await act(async () => {
    dialog.style.maxHeight = '190px'
    await userEvent.fill(input, 'Reader')
  })
  await key('{Tab}')
  const retry = [...host.querySelectorAll('button')].find(
    button => button.textContent === 'Retry report search'
  )!
  expect(document.activeElement).toBe(retry)
  expect(retry.getBoundingClientRect().bottom).toBeLessThanOrEqual(
    dialog.getBoundingClientRect().bottom
  )
  await key('{Enter}')
  expect(document.activeElement).toBe(input)
  expect(input.value).toBe('Reader')
  await pause(400)
  expect(host.querySelectorAll('[role="option"]')).toHaveLength(1)
  expect(host.querySelector('[aria-label="Report details"]')).toBeNull()
  await key('{ArrowDown}{Enter}')
  expect(dialog.open).toBe(false)
  expect(host.querySelector('[aria-label="Report details"] h3')!.textContent).toBe(
    'Reader study report'
  )
  expect(document.activeElement).toBe(host.querySelector('[aria-label="Report details"] h3'))
})

import { expect, test } from 'vitest'
import { LocaleProvider, Timeline, TimelineItem } from '../../src/index.js'
import { mount } from './familyHarness.js'

test('a hydrated RTL timeline preserves native order, dates, and active state', async () => {
  const { host } = await mount(
    <LocaleProvider locale="he-IL">
      <Timeline
        aria-label="Shipment"
        className="w-72"
      >
        <TimelineItem
          label="Packed"
          dateTime="2026-05-12"
          time="May 12"
        />
        <TimelineItem
          label="Delivered"
          dateTime="2026-05-13"
          time="May 13"
          tone="accent"
          icon="✓"
          active
        />
      </Timeline>
    </LocaleProvider>,
    true
  )
  const list = host.querySelector('ol')!
  expect(list).toHaveAccessibleName('Shipment')
  expect(Array.from(list.children, item => item.tagName)).toEqual(['LI', 'LI'])
  const active = list.querySelector('[aria-current="true"]')!
  expect(active).toBe(list.lastElementChild)
  expect(active.querySelector('time')).toHaveAttribute('datetime', '2026-05-13')
  const marker = active.querySelector('[data-slot="timeline-indicator"]')!
  const label = active.querySelector('[data-slot="timeline-label"]')!
  expect(marker).toHaveAttribute('aria-hidden', 'true')
  expect(marker.getBoundingClientRect().left).toBeGreaterThan(label.getBoundingClientRect().right)
  expect(active.querySelector('[data-slot="timeline-connector"]')).not.toBeVisible()
})

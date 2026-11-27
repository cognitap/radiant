import { createRef, type ReactNode } from 'react'
import { expect, test } from 'vitest'
import {
  AppShell,
  AppShellHeader,
  AppShellMain,
  Calendar,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Combobox,
  DatePicker,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  IconProvider,
  ICON_NAMES,
  Select,
  Sidebar,
  SidebarContent,
  SidebarTrigger,
  SortableList,
  SortableListItem,
  Spinner,
  ThemeScope,
  type IconName,
  type IconSet
} from '../../src/index.js'
import { mount, pause } from './familyHarness.js'

const probe = (name: IconName) =>
  function Probe(props: { className?: string; 'aria-hidden'?: true }) {
    return (
      <svg
        {...props}
        data-icon={name}
        viewBox="0 0 16 16"
        fill="currentColor"
      >
        <rect
          width="16"
          height="16"
        />
      </svg>
    )
  }
const icons: IconSet = Object.fromEntries(ICON_NAMES.map(name => [name, probe(name)]))

const sortText = {
  instructionsText: 'Press Space to pick up.',
  pickUpText: (item: string) => `Picked up ${item}.`,
  moveText: (item: string) => `Moved ${item}.`,
  dropText: (item: string) => `Dropped ${item}.`,
  cancelText: (item: string) => `Cancelled ${item}.`
}

function Controls() {
  return (
    <>
      <Checkbox
        label="Checked"
        defaultChecked
      />
      <Checkbox
        label="Mixed"
        indeterminate
      />
      <Select
        aria-label="Team"
        items={[{ value: 'design', label: 'Design', textValue: 'Design' }]}
        defaultValue="design"
        defaultOpen
      />
      <Combobox
        aria-label="City"
        items={[{ value: 'oslo', label: 'Oslo' }]}
        defaultValue="oslo"
      />
      <Collapsible>
        <CollapsibleTrigger>Details</CollapsibleTrigger>
        <CollapsibleContent>Body</CollapsibleContent>
      </Collapsible>
      <DatePicker aria-label="Due" />
      <Calendar aria-label="Month" />
      <SortableList
        aria-label="Order"
        {...sortText}
      >
        <SortableListItem value="a">A</SortableListItem>
      </SortableList>
      <Dialog>
        <DialogContent>
          <DialogTitle>Edit</DialogTitle>
          <DialogClose aria-label="Close" />
        </DialogContent>
      </Dialog>
      <Spinner label="Loading" />
    </>
  )
}

function Shell() {
  return (
    <div style={{ width: '480px' }}>
      <AppShell style={{ height: '300px', width: '100%' }}>
        <AppShellHeader>
          <SidebarTrigger>Toggle navigation</SidebarTrigger>
        </AppShellHeader>
        <Sidebar label="Projects">
          <SidebarContent>Links</SidebarContent>
        </Sidebar>
        <AppShellMain>Main</AppShellMain>
      </AppShell>
    </div>
  )
}

const drawn = (host: HTMLElement, name: IconName) =>
  host.ownerDocument.querySelectorAll<SVGElement>(`[data-icon="${name}"]`)

test('every listed component draws the supplied icon, hidden and in its control color, in light and dark', async () => {
  for (const mode of ['light', 'dark'] as const) {
    const { host } = await mount(
      <ThemeScope mode={mode}>
        <IconProvider icons={icons}>
          <Controls />
          <Shell />
        </IconProvider>
      </ThemeScope>
    )
    await pause(60)
    const counts: Partial<Record<IconName, number>> = {
      check: 2,
      indeterminate: 1,
      chevronDown: 2,
      chevronLeft: 1,
      chevronRight: 2,
      calendar: 1,
      grip: 1,
      close: 2,
      spinner: 1
    }
    for (const [name, count] of Object.entries(counts) as [IconName, number][]) {
      const nodes = [...drawn(host, name)]
      expect(nodes.length, name).toBeGreaterThanOrEqual(count)
      for (const node of nodes) {
        expect(node.getAttribute('aria-hidden'), name).toBe('true')
        const owner =
          node.closest(
            '[data-slot~="checkbox-indicator"], [data-slot~="select-item-indicator"], [data-slot~="spinner"], button, summary, [data-slot~="select-icon"]'
          ) ?? node
        expect(getComputedStyle(node).color, name).toBe(getComputedStyle(owner).color)
      }
    }
    expect(host.querySelector('[data-slot~="checkbox-indicator"] [data-icon="check"]')).toBeTruthy()
    expect(
      host.querySelector(
        '[data-slot~="dialog-close"]:not([data-slot~="drawer-close"]) [data-icon="close"]'
      )
    ).toBeTruthy()
    const close = host.querySelector<HTMLButtonElement>('[data-slot~="drawer-close"]')!
    expect(close.getAttribute('aria-label')).toBe('Close navigation')
    expect(close.querySelector('[data-icon="close"]')).toBeTruthy()
    const spinner = host.querySelector<SVGSVGElement>('[data-slot~="spinner"]')!
    const glyph = spinner.querySelector('[data-icon="spinner"]')!.getBoundingClientRect()
    expect(glyph.width).toBeCloseTo(spinner.getBoundingClientRect().width, 0)
    host.remove()
  }
})

test('supplied icons scale with the control size', async () => {
  const { host } = await mount(
    <IconProvider icons={icons}>
      {(['small', 'large'] as const).map(size => (
        <Select
          key={size}
          aria-label={size}
          controlSize={size}
          items={[]}
        />
      ))}
    </IconProvider>
  )
  const [small, large] = [...drawn(host, 'chevronDown')].map(
    node => node.getBoundingClientRect().width
  )
  expect(small).toBeGreaterThan(0)
  expect(large).toBeGreaterThan(small!)
})

test('without supplied icons the markup is unchanged and the built-in drawings remain', async () => {
  const markup = async (tree: ReactNode) => {
    const { host } = await mount(tree)
    await pause(60)
    const html = host.innerHTML.replace(/ (id|for|aria-[a-z]+|list|name)="[^"]*"/g, '')
    host.remove()
    return html
  }
  const plain = await markup(
    <>
      <Controls />
      <Shell />
    </>
  )
  const empty = await markup(
    <IconProvider icons={{}}>
      <Controls />
      <Shell />
    </IconProvider>
  )
  expect(empty).toBe(plain)
  expect(plain).not.toContain('data-icon')
  const { host } = await mount(<Controls />)
  expect(host.querySelectorAll('[data-slot="checkbox-indicator"]').length).toBe(4)
  expect(host.querySelector('[data-slot~="spinner-track"]')).toBeTruthy()
  expect(host.querySelector('[data-slot~="dialog-close"] svg path')).toBeTruthy()
})

test('nested providers inherit omitted icons, the spinner keeps its SVG ref, and unknown names throw', async () => {
  const ref = createRef<SVGSVGElement>()
  const { host } = await mount(
    <IconProvider icons={{ spinner: probe('spinner'), check: probe('check') }}>
      <IconProvider icons={{ check: probe('chevronUp') }}>
        <Spinner ref={ref} />
        <Checkbox
          aria-label="Inner"
          defaultChecked
        />
      </IconProvider>
    </IconProvider>
  )
  expect(ref.current?.tagName).toBe('svg')
  expect(ref.current?.querySelector('[data-icon="spinner"]')).toBeTruthy()
  expect(host.querySelector('[data-icon="chevronUp"]')).toBeTruthy()
  expect(host.querySelector('[data-icon="check"]')).toBe(null)
  await expect(
    mount(<IconProvider icons={{ star: probe('check') } as IconSet}>x</IconProvider>)
  ).rejects.toThrow('IconProvider has no icon named "star".')
  await expect(mount(<DialogCloseAlone />)).rejects.toThrow('DialogClose requires aria-label')
})

function DialogCloseAlone() {
  return (
    <Dialog>
      <DialogContent>
        <DialogTitle>Edit</DialogTitle>
        <DialogClose />
      </DialogContent>
    </Dialog>
  )
}

import { act, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { renderToString } from 'react-dom/server'
import { expect, test, vi } from 'vitest'
import { commands } from 'vitest/browser'
import {
  Matrix,
  MatrixCell,
  MatrixColumnHeader,
  MatrixCorner,
  MatrixMarker,
  MatrixRegion,
  MatrixRow,
  MatrixRowHeader,
  type MatrixProps
} from '../../src/index.js'
import {
  A2UI_PROTOCOL_VERSION,
  A2uiSurface,
  RADIANT_A2UI_EXTENSION_CATALOG_ID,
  radiantA2uiExtensionRegistry,
  type A2uiMessage,
  type CatalogDiagnostic
} from '../../src/a2ui/index.js'
import { click, key, mount } from './familyHarness.js'

const rows = ['A', 'B', 'C']
const columns = [1, 2, 3, 4]
type Options = Partial<MatrixProps> & {
  region?: ReactNode
  regionFirst?: boolean
  taken?: string[]
}

function Seats({ region, regionFirst, taken = [], ...props }: Options) {
  return (
    <Matrix
      {...(props as MatrixProps)}
      aria-label="Seats"
      columns={columns.length}
    >
      {regionFirst ? region : null}
      <MatrixRow>
        <MatrixCorner />
        {columns.map(column => (
          <MatrixColumnHeader key={column}>Seat {column}</MatrixColumnHeader>
        ))}
      </MatrixRow>
      {rows.map(row => (
        <MatrixRow key={row}>
          <MatrixRowHeader>Row {row}</MatrixRowHeader>
          {columns.map(column => (
            <MatrixCell
              key={column}
              value={`${row}${column}`}
              disabled={taken.includes(`${row}${column}`)}
            >
              {row}
              {column}
            </MatrixCell>
          ))}
        </MatrixRow>
      ))}
      {regionFirst ? null : region}
    </Matrix>
  )
}

const cell = (host: ParentNode, name: string) =>
  host.querySelector<HTMLElement>(`[data-slot~="matrix-cell"][data-value="${name}"]`)!
// Playwright refuses to click aria-disabled hosts, so these go through the DOM.
const press = (node: HTMLElement) => act(async () => node.click())
const focused = () => (document.activeElement as HTMLElement | null)?.dataset.value
const box = (node: Element) => node.getBoundingClientRect()
const description = (node: HTMLElement) =>
  (node.getAttribute('aria-describedby') ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .map(id => node.ownerDocument.getElementById(id)?.textContent)
    .join(' ')

test('Matrix exposes grid semantics so each cell announces its row, column and contents', async () => {
  const { host } = await mount(<Seats />)
  const grid = host.querySelector('[role="grid"]')!
  expect(grid.getAttribute('aria-label')).toBe('Seats')
  expect(grid.hasAttribute('aria-multiselectable')).toBe(false)
  const target = cell(host, 'B3')
  expect(target.getAttribute('role')).toBe('gridcell')
  expect(target.textContent).toBe('B3')
  const row = target.closest('[role="row"]')!
  expect(row.querySelector('[role="rowheader"]')!.textContent).toBe('Row B')
  // Header and body rows have the same number of cells, so column positions line up.
  const position = Array.from(row.children).indexOf(target)
  const header = host.querySelector('[role="row"]')!
  expect(header.children).toHaveLength(row.children.length)
  expect(header.children[position]!.getAttribute('role')).toBe('columnheader')
  expect(header.children[position]!.textContent).toBe('Seat 3')
  expect(header.children[0]!.getAttribute('role')).toBe('gridcell')
  expect(target.getAttribute('aria-selected')).toBe('false')
})

test('arrow keys, Home and End move a single roving tab stop across cells', async () => {
  const { host } = await mount(
    <>
      <button type="button">Before</button>
      <Seats
        defaultValue="B2"
        taken={['B3']}
      />
    </>
  )
  const stops = () =>
    Array.from(host.querySelectorAll<HTMLElement>('[role="gridcell"][tabindex="0"]'))
  expect(stops().map(node => node.dataset.value)).toEqual(['B2'])
  host.querySelector('button')!.focus()
  await key('{Tab}')
  expect(focused()).toBe('B2')
  await key('{ArrowRight}')
  // Unavailable cells stay reachable so people can find out why.
  expect(focused()).toBe('B3')
  expect(document.activeElement!.getAttribute('aria-disabled')).toBe('true')
  await key('{ArrowDown}')
  expect(focused()).toBe('C3')
  await key('{ArrowDown}')
  expect(focused()).toBe('C3')
  await key('{ArrowUp}{ArrowUp}')
  expect(focused()).toBe('A3')
  await key('{ArrowUp}')
  expect(focused()).toBe('A3')
  await key('{Home}')
  expect(focused()).toBe('A1')
  await key('{ArrowLeft}')
  expect(focused()).toBe('A1')
  await key('{End}')
  expect(focused()).toBe('A4')
  await key('{Control>}{End}{/Control}')
  expect(focused()).toBe('C4')
  await key('{Control>}{Home}{/Control}')
  expect(focused()).toBe('A1')
  expect(stops().map(node => node.dataset.value)).toEqual(['A1'])
  await key('{Shift>}{Tab}{/Shift}')
  await key('{Tab}')
  expect(focused()).toBe('A1')
})

test('horizontal arrows follow the reading direction in right-to-left text', async () => {
  const { host } = await mount(
    <div dir="rtl">
      <Seats />
    </div>
  )
  cell(host, 'A2').focus()
  await key('{ArrowLeft}')
  expect(focused()).toBe('A3')
  await key('{ArrowRight}{ArrowRight}')
  expect(focused()).toBe('A1')
  expect(box(cell(host, 'A1')).left).toBeGreaterThan(box(cell(host, 'A2')).left)
})

test('single selection toggles with clicks, Space and Enter and skips disabled cells', async () => {
  const onValueChange = vi.fn()
  const { host } = await mount(
    <Seats
      taken={['A2']}
      onValueChange={onValueChange}
    />
  )
  await click(cell(host, 'A1'))
  expect(onValueChange).toHaveBeenLastCalledWith('A1')
  expect(cell(host, 'A1').getAttribute('aria-selected')).toBe('true')
  await key('{ArrowDown} ')
  expect(onValueChange).toHaveBeenLastCalledWith('B1')
  expect(cell(host, 'A1').getAttribute('aria-selected')).toBe('false')
  await key('{Enter}')
  expect(onValueChange).toHaveBeenLastCalledWith(null)
  onValueChange.mockClear()
  await press(cell(host, 'A2'))
  cell(host, 'A2').focus()
  await key(' ')
  expect(onValueChange).not.toHaveBeenCalled()
  expect(cell(host, 'A2').hasAttribute('aria-selected')).toBe(true)
  expect(cell(host, 'A2').getAttribute('aria-selected')).toBe('false')
})

test('multiple selection keeps an array and a controlled Matrix can decline', async () => {
  const onValueChange = vi.fn()
  const { host } = await mount(
    <Seats
      type="multiple"
      defaultValue={['A1']}
      onValueChange={onValueChange}
    />
  )
  expect(host.querySelector('[role="grid"]')!.getAttribute('aria-multiselectable')).toBe('true')
  await click(cell(host, 'C4'))
  expect(onValueChange).toHaveBeenLastCalledWith(['A1', 'C4'])
  await click(cell(host, 'A1'))
  expect(onValueChange).toHaveBeenLastCalledWith(['C4'])

  function Declining() {
    const [value] = useState<string | null>('A1')
    return (
      <Seats
        value={value}
        onValueChange={() => {}}
      />
    )
  }
  const declined = await mount(<Declining />)
  await click(cell(declined.host, 'B2'))
  expect(cell(declined.host, 'B2').getAttribute('aria-selected')).toBe('false')
  expect(cell(declined.host, 'A1').getAttribute('aria-selected')).toBe('true')

  const off = await mount(
    <Seats
      disabled
      onValueChange={onValueChange}
    />
  )
  onValueChange.mockClear()
  await press(cell(off.host, 'B2'))
  expect(onValueChange).not.toHaveBeenCalled()
  expect(off.host.querySelector('[role="grid"]')!.getAttribute('aria-disabled')).toBe('true')
})

test('a region spans its cells, shows its label and describes every cell inside it', async () => {
  const { host, render } = await mount(
    <Seats
      region={
        <MatrixRegion
          row={2}
          column={2}
          rowSpan={2}
          columnSpan={3}
          label="Reserved"
          series="2"
        />
      }
    />
  )
  const region = host.querySelector<HTMLElement>('[data-slot~="matrix-region"]')!
  expect(region.getAttribute('aria-hidden')).toBe('true')
  expect(region.textContent).toBe('Reserved')
  const area = box(region),
    first = box(cell(host, 'B2')),
    last = box(cell(host, 'C4'))
  expect(area.left).toBeCloseTo(first.left, 0)
  expect(area.top).toBeCloseTo(first.top, 0)
  expect(area.right).toBeCloseTo(last.right, 0)
  expect(area.bottom).toBeCloseTo(last.bottom, 0)
  for (const name of ['B2', 'B4', 'C3']) expect(description(cell(host, name))).toBe('Reserved')
  for (const name of ['A2', 'B1', 'C1']) expect(description(cell(host, name))).toBe('')
  // Clicks reach the cells under a region.
  await click(cell(host, 'B3'))
  expect(cell(host, 'B3').getAttribute('aria-selected')).toBe('true')

  // A region listed before the header row still counts from the first cell row, and spans
  // stop at the last column.
  await render(
    <Seats
      regionFirst
      region={
        <MatrixRegion
          row={2}
          column={3}
          columnSpan={9}
          label="Front"
        />
      }
    />
  )
  const front = box(host.querySelector('[data-slot~="matrix-region"]')!)
  expect(front.top).toBeCloseTo(box(cell(host, 'B3')).top, 0)
  expect(front.left).toBeCloseTo(box(cell(host, 'B3')).left, 0)
  expect(front.right).toBeCloseTo(box(cell(host, 'B4')).right, 0)
  expect(description(cell(host, 'B4'))).toBe('Front')

  // A region that starts outside the grid is hidden and describes nothing.
  await render(
    <Seats
      region={
        <MatrixRegion
          row={1}
          column={5}
          label="Nowhere"
        />
      }
    />
  )
  expect(host.querySelector<HTMLElement>('[data-slot~="matrix-region"]')!.hidden).toBe(true)
  expect(host.querySelectorAll('[aria-describedby]')).toHaveLength(0)

  // Without a header row or row headers, region numbers still count cells from 1.
  await render(
    <Matrix
      aria-label="Plain"
      columns={2}
    >
      <MatrixRegion
        row={2}
        column={2}
        label="Corner"
      />
      {['X', 'Y'].map(row => (
        <MatrixRow key={row}>
          {[1, 2].map(column => (
            <MatrixCell
              key={column}
              value={`${row}${column}`}
              aria-describedby="note"
            >
              {row}
              {column}
            </MatrixCell>
          ))}
        </MatrixRow>
      ))}
    </Matrix>
  )
  const corner = box(host.querySelector('[data-slot~="matrix-region"]')!)
  expect(corner.left).toBeCloseTo(box(cell(host, 'Y2')).left, 0)
  expect(corner.top).toBeCloseTo(box(cell(host, 'Y2')).top, 0)
  expect(cell(host, 'Y2').getAttribute('aria-describedby')).toMatch(/^note \S+-label$/)
  expect(cell(host, 'X2').getAttribute('aria-describedby')).toBe('note')
})

test('a narrow container scrolls the Matrix sideways only, and a wide one fills its width', async () => {
  const many = Array.from({ length: 12 }, (_, index) => index + 1)
  const wide = (width: string) => (
    <div style={{ width }}>
      <Matrix
        aria-label="Heat"
        columns={many.length}
      >
        <MatrixRow>
          <MatrixRowHeader>Row</MatrixRowHeader>
          {many.map(column => (
            <MatrixCell key={column}>{column}</MatrixCell>
          ))}
        </MatrixRow>
        <MatrixRegion
          row={1}
          column={1}
          columnSpan={12}
          label="All"
        />
      </Matrix>
    </div>
  )
  const { host, render } = await mount(wide('360px'))
  const grid = host.querySelector<HTMLElement>('[role="grid"]')!
  expect(box(grid).width).toBeCloseTo(360, 0)
  expect(grid.scrollWidth).toBeGreaterThan(grid.clientWidth)
  expect(grid.scrollHeight).toBe(grid.clientHeight)
  expect(getComputedStyle(grid).overflowY).toBe('hidden')
  const last = host.querySelectorAll<HTMLElement>('[role="gridcell"]')[11]!
  last.focus()
  expect(grid.scrollLeft).toBeGreaterThan(0)

  await render(wide('1200px'))
  expect(grid.scrollWidth).toBe(grid.clientWidth)
  const cells = Array.from(host.querySelectorAll<HTMLElement>('[role="gridcell"]'))
  expect(box(cells[0]!).width).toBeCloseTo(box(cells[11]!).width, 0)
  expect(box(cells[11]!).right).toBeCloseTo(box(grid).right, 0)
})

test('Matrix hydrates server markup and keeps one tab stop', async () => {
  const tree = <Seats defaultValue="C2" />
  expect(renderToString(tree)).toContain('role="grid"')
  const { host } = await mount(tree, true)
  const stops = host.querySelectorAll<HTMLElement>('[role="gridcell"][tabindex="0"]')
  expect(Array.from(stops, node => node.dataset.value)).toEqual(['C2'])
})

test('cell states, series and markers stay distinct in forced colors', async () => {
  const { host } = await mount(
    <Matrix
      aria-label="States"
      columns={5}
      defaultValue="s"
    >
      <MatrixRow>
        <MatrixCell
          state="active"
          series="1"
        >
          <MatrixMarker>1</MatrixMarker>
        </MatrixCell>
        <MatrixCell state="muted">m</MatrixCell>
        <MatrixCell state="highlighted">h</MatrixCell>
        <MatrixCell value="s">s</MatrixCell>
        <MatrixCell>p</MatrixCell>
      </MatrixRow>
    </Matrix>
  )
  const [active, muted, highlighted, selected, plain] = Array.from(
    host.querySelectorAll<HTMLElement>('[role="gridcell"]')
  )
  expect(active!.dataset.state).toBe('active')
  expect(active!.dataset.series).toBe('1')
  // The series tints the cell away from the plain surface.
  expect(getComputedStyle(active!).backgroundColor).not.toBe(
    getComputedStyle(plain!).backgroundColor
  )
  expect(getComputedStyle(muted!).borderStyle).toBe('dashed')
  expect(getComputedStyle(highlighted!).backgroundColor).not.toBe(
    getComputedStyle(muted!).backgroundColor
  )
  await commands.emulatePreferences({ forcedColors: 'active' })
  expect(getComputedStyle(selected!).forcedColorAdjust).toBe('none')
  expect(getComputedStyle(highlighted!, '::after').borderTopStyle).toBe('dashed')
  expect(getComputedStyle(active!).borderTopWidth).toBe('3px')
  // The highlighted cue leaves the outline to the focus ring.
  highlighted!.focus()
  await key('{ArrowLeft}{ArrowRight}')
  expect(document.activeElement).toBe(highlighted)
  expect(highlighted!.matches(':focus-visible')).toBe(true)
  expect(getComputedStyle(highlighted!).outlineStyle).toBe('solid')
  expect(getComputedStyle(highlighted!, '::after').borderTopStyle).toBe('dashed')
  await commands.emulatePreferences({ forcedColors: 'none' })
})

test('a solid marker inverts with its selected cell', async () => {
  const { host } = await mount(
    <Matrix
      aria-label="Markers"
      columns={2}
      defaultValue="on"
    >
      <MatrixRow>
        <MatrixCell
          value="on"
          series="2"
        >
          <MatrixMarker>1</MatrixMarker>
        </MatrixCell>
        <MatrixCell value="off">
          <MatrixMarker>2</MatrixMarker>
        </MatrixCell>
      </MatrixRow>
    </Matrix>
  )
  const [on, off] = Array.from(host.querySelectorAll<HTMLElement>('[role="gridcell"]'))
  for (const cell of [on!, off!]) {
    const marker = getComputedStyle(cell.querySelector('[data-slot~="matrix-marker"]')!)
    const style = getComputedStyle(cell)
    if (cell === on) {
      // The mark takes the cell's text color as its fill and the cell's fill as its text.
      expect(marker.backgroundColor).toBe(style.color)
      expect(marker.color).toBe(style.backgroundColor)
    } else expect(marker.backgroundColor).not.toBe(style.backgroundColor)
  }
})

// Rows that own their state, so adding or removing one never re-renders the Matrix.
const rowControl: { set?: Dispatch<SetStateAction<string[]>> } = {}
function OwnedRows() {
  const [rows, setRows] = useState(['A', 'B'])
  useEffect(() => {
    rowControl.set = setRows
  }, [])
  return rows.map(row => (
    <MatrixRow key={row}>
      {[1, 2].map(column => (
        <MatrixCell
          key={column}
          value={`${row}${column}`}
          onKeyDown={event => {
            if (event.key === 'Delete') setRows(list => list.filter(item => item !== row))
          }}
        >
          {row}
          {column}
        </MatrixCell>
      ))}
    </MatrixRow>
  ))
}
const changeRows = (update: (rows: string[]) => string[]) =>
  act(async () => rowControl.set!(update))

test('rows a child adds or removes keep one tab stop and move focus off a removed cell', async () => {
  const stops = (host: ParentNode) =>
    Array.from(
      host.querySelectorAll<HTMLElement>('[role="gridcell"][tabindex="0"]'),
      node => node.dataset.value
    )
  const { host } = await mount(
    <Matrix
      aria-label="Growing"
      columns={2}
    >
      <OwnedRows />
      <MatrixRegion
        row={3}
        column={1}
        columnSpan={2}
        label="Late"
      />
    </Matrix>
  )
  expect(stops(host)).toEqual(['A1'])
  // The region starts on a row that does not exist yet, so it waits hidden.
  const region = host.querySelector<HTMLElement>('[data-slot~="matrix-region"]')!
  expect(region.hidden).toBe(true)
  await changeRows(rows => [...rows, 'C'])
  expect(host.querySelectorAll('[role="gridcell"]')).toHaveLength(6)
  expect(stops(host)).toEqual(['A1'])
  expect(region.hidden).toBe(false)
  expect(description(cell(host, 'C2'))).toBe('Late')
  expect(box(region).top).toBeCloseTo(box(cell(host, 'C1')).top, 0)
  // A row inserted before the first moves the tab stop with nothing else rendering.
  await changeRows(rows => ['Z', ...rows])
  expect(stops(host)).toEqual(['Z1'])
  await changeRows(rows => rows.slice(1))

  cell(host, 'C2').focus()
  expect(stops(host)).toEqual(['C2'])
  await changeRows(rows => rows.slice(0, -1))
  // The remembered cell is gone; the tab stop moves to the same column of the nearest row.
  expect(stops(host)).toEqual(['B2'])
  expect(focused()).toBe('B2')
  expect(region.hidden).toBe(true)

  // Removing the focused cell from inside keeps focus in the grid, in the same column of the
  // row that took its place.
  await changeRows(() => ['A', 'B', 'C'])
  cell(host, 'B2').focus()
  await key('{Delete}')
  expect(cell(host, 'B2')).toBeNull()
  expect(focused()).toBe('C2')
  expect(stops(host)).toEqual(['C2'])
})

test('server markup has one tab stop: the selected cell, else none until the first mounts', () => {
  const selected = renderToString(<Seats defaultValue="B2" />)
  expect(selected.match(/tabindex="0"/g)).toHaveLength(1)
  expect(selected).toMatch(/tabindex="0"[^>]*data-value="B2"/)
  expect(renderToString(<Seats />)).not.toContain('tabindex="0"')
})

test('Matrix rejects values outside its documented unions', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  expect(() =>
    renderToString(
      <Matrix
        aria-label="Bad"
        columns={0}
      />
    )
  ).toThrow('Matrix columns must be a positive integer.')
  expect(() =>
    renderToString(
      <Matrix
        aria-label="Bad"
        columns={1}
      >
        <MatrixRow>
          <MatrixCell state={'loud' as 'active'} />
        </MatrixRow>
      </Matrix>
    )
  ).toThrow('MatrixCell state must be one of active, muted, highlighted.')
  expect(() =>
    renderToString(
      <Matrix
        aria-label="Bad"
        columns={1}
      >
        <MatrixRegion
          row={0}
          column={1}
          label="x"
        />
      </Matrix>
    )
  ).toThrow('MatrixRegion row must be a positive integer.')
  expect(() =>
    renderToString(
      <Matrix
        aria-label="Bad"
        columns={1}
      >
        <MatrixRow>
          <MatrixCell series={'9' as '1'} />
        </MatrixRow>
      </Matrix>
    )
  ).toThrow('MatrixCell series must be one of 1 to 8.')
  expect(() =>
    renderToString(
      <Matrix
        columns={1}
        {...({} as { 'aria-label': string })}
      />
    )
  ).toThrow('Matrix requires aria-label or aria-labelledby.')
  error.mockRestore()
})

test('the A2UI Matrix reports what it drops, clamps or makes unselectable', async () => {
  const diagnostics: CatalogDiagnostic[] = []
  const messages: A2uiMessage[] = [
    {
      version: A2UI_PROTOCOL_VERSION,
      createSurface: {
        surfaceId: 'coerced_matrix',
        catalogId: RADIANT_A2UI_EXTENSION_CATALOG_ID,
        components: [
          {
            id: 'root',
            component: 'Matrix',
            label: 'Seats',
            selection: 'single',
            columns: [{ label: '1' }, { label: '2' }],
            rows: [
              { label: 'A', cells: [{ value: 'a' }, { value: 'a' }, { value: 'c' }] },
              { label: 'B', cells: [{ value: 'b' }] }
            ],
            regions: [
              { row: 1, column: 2, rowSpan: 3, label: 'Edge' },
              { row: 4, column: 1, label: 'Gone' }
            ]
          }
        ]
      }
    }
  ]
  const { host } = await mount(
    <A2uiSurface
      surfaceId="coerced_matrix"
      messages={messages}
      registry={radiantA2uiExtensionRegistry}
      onDiagnostic={diagnostic => diagnostics.push(diagnostic)}
    />
  )
  expect(host.querySelectorAll('[data-slot~="matrix-cell"]')).toHaveLength(4)
  expect(host.querySelectorAll('[role="gridcell"][aria-selected]')).toHaveLength(2)
  const coerced = (prop: string, received: number, used: number) =>
    expect.objectContaining({ kind: 'coerced', component: 'Matrix', prop, received, used })
  expect(diagnostics).toEqual(
    expect.arrayContaining([
      coerced('rows', 4, 3),
      coerced('rows', 4, 2),
      coerced('regions', 2, 1),
      coerced('regions', 3, 2)
    ])
  )
})

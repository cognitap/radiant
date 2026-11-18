import { act } from 'react'
import { expect, test } from 'vitest'
import { DataTable, type DataTableColumn } from '../../src/index.js'
import { click, mount } from './familyHarness.js'

type Row = { id: string; amount: number }
const columns: readonly DataTableColumn<Row>[] = [
  { id: 'id', header: 'Invoice', rowHeader: true, cell: row => row.id },
  {
    id: 'amount',
    header: 'Amount',
    cell: row => row.amount,
    compare: (a, b) => a.amount - b.amount
  }
]
const rows = [
  { id: 'a', amount: 300 },
  { id: 'b', amount: 100 },
  { id: 'c', amount: 200 }
]
const getRowId = (row: Row) => row.id

test('hydrates a native table, cycles sort directions and updates the mixed select-all checkbox', async () => {
  const { host } = await mount(
    <DataTable
      caption="Invoices"
      columns={columns}
      rows={rows}
      getRowId={getRowId}
      selection={{
        allLabel: 'Select all invoices',
        labelForRow: row => 'Select ' + row.id,
        isRowDisabled: row => row.id === 'c'
      }}
    />,
    true
  )
  const table = host.querySelector('table')!
  const keys = () =>
    Array.from(table.querySelectorAll<HTMLElement>('[data-row-key]'), row => row.dataset.rowKey)
  const inputs = () => Array.from(table.querySelectorAll('input'))
  const sort = table.querySelector('button')!
  expect(table).toHaveAccessibleName('Invoices')
  expect(table.querySelector('tbody th')).toHaveAttribute('scope', 'row')
  await click(sort)
  expect(keys()).toEqual(['b', 'c', 'a'])
  expect(sort.closest('th')).toHaveAttribute('aria-sort', 'ascending')
  await click(sort)
  expect(keys()).toEqual(['a', 'c', 'b'])
  expect(sort.closest('th')).toHaveAttribute('aria-sort', 'descending')
  await click(inputs()[1])
  expect(inputs()[0].indeterminate).toBe(true)
  await click(inputs()[0])
  expect(inputs().map(input => input.checked)).toEqual([true, true, false, true])
  expect(inputs()[2]).toBeDisabled()
  await click(inputs()[0])
  expect(inputs().every(input => !input.checked)).toBe(true)
})

test('virtual window has native indexed rows, a sticky header, and retains the focused row', async () => {
  const entries = Array.from({ length: 800 }, (_, index) => ({
    id: 'invoice-' + index,
    amount: index
  }))
  const { host } = await mount(
    <DataTable
      caption="Invoice history"
      columns={columns}
      rows={entries}
      getRowId={getRowId}
      virtual={{ height: 240, rowHeight: 36 }}
      selection={{ allLabel: 'Select all', labelForRow: row => 'Select ' + row.id }}
    />
  )
  const viewport = host.querySelector('section')!
  const table = viewport.querySelector('table')!
  const visible = () => table.querySelectorAll<HTMLTableRowElement>('tr[data-row-key]')
  const focused = visible()[0].querySelector('input')!
  expect(table).toHaveAttribute('aria-rowcount', '801')
  expect(table.querySelector('thead tr')).toHaveAttribute('aria-rowindex', '1')
  expect(visible()[0]).toHaveAttribute('aria-rowindex', '2')
  expect(visible().length).toBeLessThan(20)
  expect(visible()[0].getBoundingClientRect().height).toBe(36)
  await act(async () => focused.focus())
  await act(async () => {
    viewport.scrollTop = 20_000
  })
  await expect.poll(() => Number(visible()[1]?.getAttribute('aria-rowindex'))).toBeGreaterThan(450)
  expect(focused).toHaveFocus()
  expect(visible().length).toBeLessThan(20)
  expect(table.querySelector('thead th')!.getBoundingClientRect().top).toBeCloseTo(
    viewport.getBoundingClientRect().top + viewport.clientTop,
    0
  )
})

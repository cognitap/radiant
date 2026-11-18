import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { DataTable, type DataTableColumn } from './DataTable.js'

type Invoice = { id: string; client: string; amount: number; paid: boolean }
const invoices: readonly Invoice[] = [
  { id: '1012', client: 'Northwind', amount: 840, paid: true },
  { id: '1046', client: 'Cedar Studio', amount: 320, paid: false },
  { id: '1064', client: 'Juniper Works', amount: 560, paid: false }
]
const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
})
const columns: readonly DataTableColumn<Invoice>[] = [
  {
    id: 'client',
    header: 'Client',
    rowHeader: true,
    cell: row => row.client,
    compare: (a, b) => a.client.localeCompare(b.client)
  },
  {
    id: 'amount',
    header: 'Amount',
    width: 100,
    cell: row => money.format(row.amount),
    compare: (a, b) => a.amount - b.amount
  },
  { id: 'status', header: 'Status', width: 100, cell: row => (row.paid ? 'Paid' : 'Open') }
]
const getRowId = (row: Invoice) => row.id
const history = Array.from({ length: 500 }, (_, i): Invoice => ({
  id: String(2301 + i),
  client: invoices[i % invoices.length].client,
  amount: (i * 37) % 2700,
  paid: i % 4 !== 0
}))

const meta = {
  title: 'Components/DataTable',
  component: DataTable<Invoice>,
  args: { caption: 'Invoices', rows: invoices, columns, getRowId, className: 'w-full max-w-lg' },
  parameters: {
    docs: {
      description: {
        component:
          'Compose a native table with sortable column headings and optional checkbox selection. Windowed mode keeps semantic rows and a sticky header while limiting the rendered rows.'
      }
    }
  }
} satisfies Meta<typeof DataTable<Invoice>>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

function ExportSelection() {
  const [value, setValue] = useState<readonly string[]>([])
  return (
    <div className="grid w-full max-w-lg gap-2">
      <DataTable
        caption="Invoices to export"
        rows={invoices}
        columns={columns}
        getRowId={getRowId}
        selection={{
          value,
          onValueChange: setValue,
          allLabel: 'Select all unpaid invoices',
          labelForRow: row => 'Select invoice ' + row.id,
          isRowDisabled: row => row.paid
        }}
      />
      <output className="text-sm">{value.length} selected</output>
    </div>
  )
}
export const SelectInvoicesToExport: Story = { render: () => <ExportSelection /> }

export const BrowseInvoiceHistory: Story = {
  render: () => (
    <DataTable
      caption="Invoice history"
      rows={history}
      columns={columns}
      getRowId={getRowId}
      virtual={{ height: 272, rowHeight: 40 }}
      className="w-full max-w-lg"
      parts={{ table: { className: 'min-w-72' } }}
    />
  )
}

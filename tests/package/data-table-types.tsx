import { DataTable, type DataTableColumn } from '@cognitap/radiant'

type Invoice = { id: string; total: number }
const rows: readonly Invoice[] = [{ id: '101', total: 58 }]
const columns: readonly DataTableColumn<Invoice>[] = [
  { id: 'total', header: 'Total', compare: (a, b) => a.total - b.total, cell: row => row.total }
]

export const invoices = (
  <DataTable
    caption="Invoices"
    getRowId={row => row.id}
    rows={rows}
    columns={columns}
    defaultSort={{ column: 'total', direction: 'ascending' }}
    selection={{ allLabel: 'Select all', labelForRow: row => row.id }}
  />
)

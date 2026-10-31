import type { Meta, StoryObj } from '@storybook/react-vite'
import { Table } from './index.js'
import {
  InvoiceTotals,
  MemberActions,
  NoMatchingInvoices,
  TeamTable,
  WideSignups,
  type TableTaskOptions
} from '../.storybook/examples/TableExamples.js'
const meta = {
  title: 'Components/Table',
  component: Table,
  parameters: {
    docs: {
      description: {
        component:
          'Native table parts: Table, TableCaption, TableHead, TableBody, TableFoot, TableRow, TableHeader and TableCell. TableCaption names the table. TableHeader defaults to scope="col"; pass scope="row" for row headers. Wrap a wide table in TableContainer, a named, keyboard-scrollable region. Links and buttons inside cells keep their own semantics. Applications own sorting, filtering, selection and virtualization; no grid behavior is added.'
      }
    }
  },
  argTypes: {
    className: { control: 'text' },
    style: { control: 'object' }
  }
} satisfies Meta<TableTaskOptions>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = { render: options => <TeamTable {...options} /> }
export const AligningNumbers: Story = { render: options => <InvoiceTotals {...options} /> }
export const ActionsInCells: Story = { render: options => <MemberActions {...options} /> }
export const ScrollingWideTables: Story = { render: options => <WideSignups {...options} /> }
export const EmptyTable: Story = { render: options => <NoMatchingInvoices {...options} /> }
export const Customisation: Story = {
  args: {
    style: {
      '--rad-table-padding-inline': '1.25rem',
      '--rad-table-padding-block': '1rem',
      '--rad-table-font-size': '1rem',
      '--rad-table-header-background': 'transparent'
    }
  },
  render: options => <InvoiceTotals {...options} />
}

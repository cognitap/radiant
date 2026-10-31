import { useId, useState } from 'react'
import {
  Button,
  Link,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableContainer,
  TableFoot,
  TableHead,
  TableHeader,
  TableRow,
  type TableProps
} from '../../src/index.js'
export type TableTaskOptions = Pick<TableProps, 'className' | 'style'>
const frame = { width: '32rem', maxWidth: '100%' }
const numeric = { textAlign: 'end', fontVariantNumeric: 'tabular-nums' } as const
const members = [
  { name: 'Jordan Rivera', role: 'Researcher', location: 'Lisbon' },
  { name: 'Sam Lee', role: 'Designer', location: 'Seoul' },
  { name: 'Ade Okafor', role: 'Engineer', location: 'Lagos' }
]
export function TeamTable(props: TableTaskOptions) {
  return (
    <div style={frame}>
      <Table {...props}>
        <TableCaption>Team members</TableCaption>
        <TableHead>
          <TableRow>
            <TableHeader>Name</TableHeader>
            <TableHeader>Role</TableHeader>
            <TableHeader>Location</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {members.map(member => (
            <TableRow key={member.name}>
              <TableHeader scope="row">{member.name}</TableHeader>
              <TableCell>{member.role}</TableCell>
              <TableCell>{member.location}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
const invoices = [
  { id: 'INV-1042', hours: 12, amount: '1,440.00' },
  { id: 'INV-1043', hours: 7.5, amount: '900.00' },
  { id: 'INV-1044', hours: 31, amount: '3,720.00' }
]
export function InvoiceTotals(props: TableTaskOptions) {
  return (
    <div style={frame}>
      <Table {...props}>
        <TableCaption>October invoices</TableCaption>
        <TableHead>
          <TableRow>
            <TableHeader>Invoice</TableHeader>
            <TableHeader style={numeric}>Hours</TableHeader>
            <TableHeader style={numeric}>Amount (EUR)</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {invoices.map(invoice => (
            <TableRow key={invoice.id}>
              <TableHeader scope="row">{invoice.id}</TableHeader>
              <TableCell style={numeric}>{invoice.hours.toFixed(1)}</TableCell>
              <TableCell style={numeric}>{invoice.amount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFoot>
          <TableRow>
            <TableHeader scope="row">Total</TableHeader>
            <TableCell style={numeric}>50.5</TableCell>
            <TableCell style={numeric}>6,060.00</TableCell>
          </TableRow>
        </TableFoot>
      </Table>
    </div>
  )
}
export function MemberActions(props: TableTaskOptions) {
  const [selected, setSelected] = useState('None')
  return (
    <div style={frame}>
      <Table {...props}>
        <TableCaption>Review assignments</TableCaption>
        <TableHead>
          <TableRow>
            <TableHeader>Name</TableHeader>
            <TableHeader>Profile</TableHeader>
            <TableHeader>Action</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {members.map(({ name }) => {
            const first = name.split(' ')[0]
            return (
              <TableRow key={name}>
                <TableHeader scope="row">{name}</TableHeader>
                <TableCell>
                  <Link href="#profile">View {first}</Link>
                </TableCell>
                <TableCell>
                  <Button
                    controlSize="small"
                    variant="outline"
                    onClick={() => setSelected(name)}
                  >
                    Assign {first}
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <output>Reviewer: {selected}</output>
    </div>
  )
}
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
const regions = [
  { name: 'Europe', signups: [120, 134, 151, 149, 170, 182, 190, 204] },
  { name: 'Asia Pacific', signups: [98, 110, 117, 131, 140, 152, 161, 175] }
]
export function WideSignups(props: TableTaskOptions) {
  const caption = useId()
  return (
    <div style={frame}>
      <TableContainer aria-labelledby={caption}>
        <Table
          {...props}
          style={{ minWidth: '48rem', ...props.style }}
        >
          <TableCaption id={caption}>Monthly signups by region</TableCaption>
          <TableHead>
            <TableRow>
              <TableHeader>Region</TableHeader>
              {months.map(month => (
                <TableHeader
                  key={month}
                  style={numeric}
                >
                  {month}
                </TableHeader>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {regions.map(region => (
              <TableRow key={region.name}>
                <TableHeader scope="row">{region.name}</TableHeader>
                {region.signups.map((count, index) => (
                  <TableCell
                    key={months[index]}
                    style={numeric}
                  >
                    {count}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  )
}
export function NoMatchingInvoices(props: TableTaskOptions) {
  return (
    <div style={frame}>
      <Table {...props}>
        <TableCaption>Overdue invoices</TableCaption>
        <TableHead>
          <TableRow>
            <TableHeader>Invoice</TableHeader>
            <TableHeader>Client</TableHeader>
            <TableHeader style={numeric}>Amount (EUR)</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell
              colSpan={3}
              style={{ textAlign: 'center' }}
            >
              No invoices are overdue.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}

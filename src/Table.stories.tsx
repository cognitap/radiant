import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Table,
  TableCaption,
  TableHead,
  TableBody,
  TableFoot,
  TableRow,
  TableHeader,
  TableCell,
  TableContainer,
  Link,
  Button
} from './index.js'
const meta = {
  title: 'Components/Table',
  component: Table,
  parameters: {
    docs: {
      description: {
        component:
          'Native table parts with captions, column and row headers, native ids/headers and an optional named keyboard scroll region. Cell links and buttons keep their normal semantics. Applications own content, complex header associations, naming, sorting, filtering and virtualization; no grid behavior is added.'
      }
    }
  }
} satisfies Meta<typeof Table>
export default meta
type Story = StoryObj<typeof meta>
function Members({ wide = false, custom = false }: { wide?: boolean; custom?: boolean }) {
  const [selected, setSelected] = useState('None')
  return (
    <div style={{ width: '32rem', maxWidth: '100%' }}>
      <TableContainer aria-label="Scrollable team members">
        <Table
          style={{
            minWidth: wide ? '42rem' : undefined,
            ...(custom
              ? {
                  '--rad-table-padding-inline': '1.25rem',
                  '--rad-table-padding-block': '1rem',
                  '--rad-table-font-size': '1rem'
                }
              : {})
          }}
        >
          <TableCaption>Team members</TableCaption>
          <TableHead>
            <TableRow>
              <TableHeader>Name</TableHeader>
              <TableHeader>Profile</TableHeader>
              <TableHeader>Action</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {['Jordan Rivera', 'Sam Lee'].map(name => (
              <TableRow key={name}>
                <TableHeader scope="row">{name}</TableHeader>
                <TableCell>
                  <Link href="#profile">View {name.split(' ')[0]}</Link>
                </TableCell>
                <TableCell>
                  <Button
                    controlSize="small"
                    variant="outline"
                    onClick={() => setSelected(name)}
                  >
                    Select {name.split(' ')[0]}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFoot>
            <TableRow>
              <TableCell colSpan={3}>2 members</TableCell>
            </TableRow>
          </TableFoot>
        </Table>
      </TableContainer>
      <output>Selected: {selected}</output>
    </div>
  )
}
export const Default: Story = { render: () => <Members /> }
export const Overflow: Story = { render: () => <Members wide /> }
export const Customisation: Story = { render: () => <Members custom /> }

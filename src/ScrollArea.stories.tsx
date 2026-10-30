import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  ScrollArea,
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectPortal,
  SelectContent,
  SelectItem,
  Table,
  TableCaption,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose
} from './index.js'
const meta = {
  title: 'Components/ScrollArea',
  component: ScrollArea,
  args: { 'aria-label': 'Recent activity', orientation: 'vertical', visibility: 'hover' },
  argTypes: {
    orientation: { control: 'select', options: ['vertical', 'horizontal', 'both'] },
    visibility: { control: 'select', options: ['hover', 'scroll', 'always'] }
  },
  parameters: {
    docs: {
      description: {
        component:
          'The native div is the named scrolling group and keyboard owner. Themed bars stay inside it, preserving wheel, touch and keyboard scrolling, including over the marks themselves. Give the viewport a constrained height or width; applications own content. Refs and native props reach the viewport; content, track and thumb styling have separate parts. In menus and listboxes, use tabIndex=-1 so the widget retains its focus sequence.'
      }
    }
  }
} satisfies Meta<typeof ScrollArea>
export default meta
type Story = StoryObj<typeof meta>
const entries = Array.from({ length: 24 }, (_, index) => ({
  value: String(index),
  label: `Project ${index + 1}`
}))
function Activity({ small = false }: { small?: boolean }) {
  return (
    <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {entries.slice(0, small ? 2 : 24).map((item, index) => (
        <li
          key={item.value}
          style={{ padding: '0.75rem', borderBottom: '1px solid var(--rad-color-border)' }}
        >
          <strong>{item.label}</strong>
          <p style={{ margin: '0.25rem 0 0' }}>The team shared update {index + 1}.</p>
        </li>
      ))}
    </ol>
  )
}
export const Default: Story = {
  render: args => (
    <ScrollArea
      {...args}
      style={{ width: '24rem', height: '16rem', maxWidth: '100%' }}
    >
      <Activity />
    </ScrollArea>
  )
}
export const ExploringWideRecords: Story = {
  render: () => (
    <ScrollArea
      aria-label="Quarterly estimates"
      orientation="both"
      visibility="always"
      style={{ width: '32rem', height: '16rem', maxWidth: '100%' }}
    >
      <Table style={{ minWidth: '48rem' }}>
        <TableCaption>Quarterly estimates</TableCaption>
        <TableHead>
          <TableRow>
            <TableHeader>Team</TableHeader>
            {['Q1', 'Q2', 'Q3', 'Q4'].map(quarter => (
              <TableHeader key={quarter}>{quarter}</TableHeader>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.slice(0, 12).map((item, index) => (
            <TableRow key={item.value}>
              <TableHeader scope="row">{item.label}</TableHeader>
              {[1, 2, 3, 4].map(quarter => (
                <TableCell key={quarter}>{(index + 1) * quarter * 10} hours</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  )
}
export const ChoosingFromLongLists: Story = {
  render: () => (
    <Select items={entries}>
      <SelectTrigger aria-label="Project">
        <SelectValue placeholder="Choose a project" />
      </SelectTrigger>
      <SelectPortal>
        <SelectContent>
          <ScrollArea
            aria-label="Available projects"
            tabIndex={-1}
            style={{ maxHeight: '12rem' }}
          >
            {entries.map(item => (
              <SelectItem
                key={item.value}
                value={item.value}
              >
                {item.label}
              </SelectItem>
            ))}
          </ScrollArea>
        </SelectContent>
      </SelectPortal>
    </Select>
  )
}
function FilteringActivity() {
  const [small, setSmall] = useState(false)
  return (
    <div style={{ display: 'grid', gap: '1rem', width: '24rem', maxWidth: '100%' }}>
      <Button
        variant="outline"
        onClick={() => setSmall(!small)}
      >
        {small ? 'Show all activity' : 'Show recent activity'}
      </Button>
      <ScrollArea
        aria-label="Filtered activity"
        visibility="scroll"
        style={{ height: '16rem' }}
        parts={{
          content: { style: { padding: '0.5rem' } },
          thumb: { style: { '--rad-scroll-area-size': '8px' } }
        }}
      >
        <Activity small={small} />
      </ScrollArea>
    </div>
  )
}
export const FilteringUpdates: Story = { render: () => <FilteringActivity /> }
export const ReadingHistoryInDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger>Read history</DialogTrigger>
      <DialogContent>
        <DialogTitle>Project history</DialogTitle>
        <DialogDescription>Scroll through the updates before closing.</DialogDescription>
        <ScrollArea
          aria-label="Project history entries"
          style={{ maxHeight: '16rem' }}
        >
          <Activity />
        </ScrollArea>
        <DialogClose>Close history</DialogClose>
      </DialogContent>
    </Dialog>
  )
}

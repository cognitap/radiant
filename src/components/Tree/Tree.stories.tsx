import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tree, type TreeItem } from './Tree.js'
import { LocaleProvider } from '../LocaleProvider/LocaleProvider.js'

const files: readonly TreeItem[] = [
  {
    value: 'research',
    label: 'Research',
    children: [
      { value: 'interviews', label: 'Interviews' },
      { value: 'notes', label: 'Field notes' },
      { value: 'transcripts', label: 'Transcripts', disabled: true }
    ]
  },
  {
    value: 'reports',
    label: 'Reports',
    children: [
      { value: 'summary', label: 'Summary' },
      { value: 'findings', label: 'Findings' }
    ]
  },
  { value: 'readme', label: 'Read me' }
]

const meta = {
  title: 'Components/Tree',
  component: Tree,
  args: { 'aria-label': 'Project files', items: files, defaultExpanded: ['research'] },
  parameters: {
    docs: {
      description: {
        component:
          'Browse nested items with arrow keys, Home, End, and locale-aware type-ahead. In RTL the horizontal keys reverse. Press Enter or Space to select. Checkboxes select loaded, enabled leaves and derive mixed parent state. Expand an async branch to load it and press Enter to retry a failed request. Provide a viewport height and fixed row height to virtualize visible items.'
      }
    }
  }
} satisfies Meta<typeof Tree>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

function FilePreview() {
  const [value, setValue] = useState<string | null>('notes')
  return (
    <div className="grid w-full max-w-lg gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Tree
        aria-label="Project files"
        items={files}
        defaultExpanded={['research']}
        value={value}
        onValueChange={setValue}
      />
      <section className="rounded-[var(--rad-surface-radius)] border border-[var(--rad-color-border)] p-3">
        <h2 className="text-sm font-semibold">File preview</h2>
        <output
          className="block text-sm"
          aria-live="polite"
        >
          {value ?? 'Choose a file'}
        </output>
      </section>
    </div>
  )
}
export const Controlled: Story = { render: () => <FilePreview /> }

export const ChooseFilesToExport: Story = {
  render: () => (
    <Tree
      aria-label="Files to export"
      type="multiple"
      checkboxes
      items={files}
      defaultExpanded={['research', 'reports']}
      defaultValue={['notes']}
    />
  )
}

const archives: readonly TreeItem[] = [
  {
    value: 'archive',
    label: 'Archived projects',
    loadChildren: signal =>
      new Promise(resolve => {
        const timer = setTimeout(() => resolve(files), 650)
        signal.addEventListener('abort', () => clearTimeout(timer), { once: true })
      })
  }
]
export const BrowseAnArchive: Story = {
  args: { 'aria-label': 'Archive', items: archives, defaultExpanded: [] }
}

const auditRecords = Array.from({ length: 750 }, (_, index) => ({
  value: `entry-${index + 1}`,
  label: `Audit record ${index + 1}`
}))
export const BrowseAnAuditLog: Story = {
  args: {
    'aria-label': 'Audit log',
    items: [{ value: 'audit', label: 'Review history', children: auditRecords }],
    defaultExpanded: ['audit'],
    virtual: { height: 288, rowHeight: 36 }
  }
}

export const BrowseInHebrew: Story = {
  render: () => (
    <LocaleProvider locale="he-IL">
      <Tree
        aria-label="מסמכי מחקר"
        items={[
          { value: 'reports', label: 'דוחות', children: [{ value: 'summary', label: 'סיכום' }] },
          { value: 'notes', label: 'הערות' }
        ]}
      />
    </LocaleProvider>
  )
}

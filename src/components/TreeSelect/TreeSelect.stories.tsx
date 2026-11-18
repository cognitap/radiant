import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../Button/Button.js'
import { Field } from '../Field/Field.js'
import type { TreeItem } from '../Tree/Tree.js'
import { TreeSelect } from './TreeSelect.js'

const departments: readonly TreeItem[] = [
  {
    value: 'engineering',
    label: 'Engineering',
    children: [
      { value: 'platform', label: 'Platform' },
      { value: 'security', label: 'Security' }
    ]
  },
  {
    value: 'product',
    label: 'Product',
    children: [
      { value: 'design', label: 'Design' },
      { value: 'research', label: 'Research' }
    ]
  },
  { value: 'operations', label: 'Operations' }
]

const meta = {
  title: 'Components/TreeSelect',
  component: TreeSelect,
  args: { 'aria-label': 'Department', items: departments, className: 'w-full max-w-xs' },
  parameters: {
    docs: {
      description: {
        component:
          'Choose from a hierarchy in a Select popup. Single selection shows the full path. Multiple selection shows a tag for each path. Open with Enter, Space, or the vertical arrow keys, navigate with Tree shortcuts, and press Escape to return to the trigger.'
      }
    }
  }
} satisfies Meta<typeof TreeSelect>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithField: Story = {
  render: () => <DepartmentForm />
}

function DepartmentForm() {
  const [submitted, setSubmitted] = useState('')
  return (
    <form
      className="grid w-full max-w-xs gap-3"
      onSubmit={event => {
        event.preventDefault()
        setSubmitted(String(new FormData(event.currentTarget).get('department') ?? ''))
      }}
      onReset={() => setSubmitted('')}
    >
      <Field
        label="Department"
        description="Choose the team that will receive this request."
        required
      >
        <TreeSelect
          name="department"
          placeholder="Choose a department"
          className="w-full"
          items={departments}
        />
      </Field>
      <div className="flex gap-2">
        <Button type="submit">Assign request</Button>
        <Button
          type="reset"
          variant="outline"
        >
          Reset
        </Button>
      </div>
      <output aria-live="polite">{submitted && `Assigned to ${submitted}`}</output>
    </form>
  )
}

export const SharedControlSizes: Story = {
  render: () => (
    <div className="grid w-full max-w-xs gap-3">
      {(['small', 'medium', 'large'] as const).map(size => (
        <Field
          key={size}
          label={size[0].toUpperCase() + size.slice(1)}
        >
          <TreeSelect
            items={departments}
            controlSize={size}
            defaultValue="platform"
            className="w-full"
          />
        </Field>
      ))}
    </div>
  )
}

function Reviewers() {
  const [reviewers, setReviewers] = useState(['platform', 'design'])
  return (
    <div className="w-full max-w-xs">
      <Field label="Reviewing teams">
        <TreeSelect
          type="multiple"
          checkboxes
          items={departments}
          value={reviewers}
          onValueChange={setReviewers}
          className="w-full"
          placeholder="Choose reviewing teams"
        />
      </Field>
    </div>
  )
}
export const Controlled: Story = {
  name: 'Choose reviewing teams',
  render: () => <Reviewers />
}

const archive: readonly TreeItem[] = [
  {
    value: 'archive',
    label: 'Archived departments',
    loadChildren: signal =>
      new Promise(resolve => {
        const timer = setTimeout(() => resolve(departments), 650)
        signal.addEventListener('abort', () => clearTimeout(timer), { once: true })
      })
  }
]

export const SearchAnArchive: Story = {
  name: 'Browse an archive',
  args: { 'aria-label': 'Archived team', items: archive }
}

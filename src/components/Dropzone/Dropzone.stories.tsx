import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Field } from '../Field/Field.js'
import { Progress } from '../Progress/Progress.js'
import { Dropzone } from './Dropzone.js'

const meta = {
  title: 'Components/Dropzone',
  component: Dropzone,
  args: {
    description: 'Choose or drop images.',
    accept: 'image/*',
    multiple: true,
    className: 'max-w-sm'
  }
} satisfies Meta<typeof Dropzone>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const WithField: Story = {
  render: () => (
    <Field
      className="w-full max-w-sm"
      label="Expense receipt"
      required
    >
      <Dropzone
        name="receipt"
        accept="image/*,.pdf"
        maxSize={5_000_000}
        description="Image or PDF, up to 5 MB."
      />
    </Field>
  )
}
function PrepareAttachments() {
  const [selection, setSelection] = useState(0)
  return (
    <div className="grid w-full max-w-sm gap-3">
      <Dropzone
        accept=".txt"
        multiple
        maxFiles={3}
        description="Up to three text files."
        onFilesChange={result => setSelection(result.accepted.length)}
      />
      {selection > 0 && (
        <Progress
          aria-label="Attachments ready"
          value={selection}
          max={3}
        />
      )}
    </div>
  )
}
export const PrepareMessageAttachments: Story = { render: () => <PrepareAttachments /> }

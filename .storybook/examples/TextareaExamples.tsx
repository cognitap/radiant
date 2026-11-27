import { useState } from 'react'
import { Field, Textarea } from '../../src/index.js'

export function TextareaControlledExample() {
  const [note, setNote] = useState('')

  return (
    <Field
      label="Notes"
      description={`${note.length}/160 characters`}
      style={{ width: '100%', maxWidth: '32rem' }}
    >
      <Textarea
        name="notes"
        value={note}
        maxLength={160}
        onChange={event => setNote(event.currentTarget.value)}
      />
    </Field>
  )
}

export function TextareaAutoGrowExample() {
  return (
    <Field
      label="Reply"
      style={{ width: 'min(32rem, calc(100vw - 2rem))', maxWidth: '100%' }}
    >
      <Textarea
        name="reply"
        placeholder="Write a reply…"
        className="field-sizing-content resize-none max-h-[calc(10lh+1rem)]"
      />
    </Field>
  )
}

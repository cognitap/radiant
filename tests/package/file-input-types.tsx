import { createRef } from 'react'
import { FileInput, type FileInputProps, defineTheme } from '@cognitap/radiant'
export const attachments = (
  <FileInput
    name="attachments"
    form="upload"
    accept=".pdf"
    multiple
    required
    controlSize="small"
    chooseLabel="Add files"
    emptyText="Nothing attached"
    onChange={event => event.currentTarget.files}
    ref={createRef<HTMLInputElement>()}
    parts={{ wrapper: { style: { gap: '8px' } }, trigger: { className: 'w-40' }, files: {} }}
  />
)
export const theme = defineTheme({
  id: 'file',
  name: 'File',
  components: { fileInput: { gap: '8px' } }
})
// @ts-expect-error The component owns its native type.
export const type: FileInputProps = { type: 'text' }
// @ts-expect-error The browser owns the chosen files.
export const value: FileInputProps = { value: 'notes.txt' }
// @ts-expect-error Read-only is not enforced for file inputs.
export const readOnly: FileInputProps = { readOnly: true }
// @ts-expect-error The ref is the actual input, not its wrapper.
export const wrapper: FileInputProps = { ref: createRef<HTMLDivElement>() }

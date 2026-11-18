import { Dropzone, type DropzoneSelection } from '@cognitap/radiant'

export const attachment = (
  <Dropzone
    name="attachment"
    accept=".txt"
    onFilesChange={(files: DropzoneSelection) => files.accepted.map(file => file.name)}
  />
)

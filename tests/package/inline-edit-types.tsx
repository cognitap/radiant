import { InlineEdit, type InlineEditProps } from '@cognitap/radiant'

const props: InlineEditProps = {
  inputLabel: 'Name',
  value: 'Draft',
  validate: draft => (draft.trim() ? undefined : 'Name is required.')
}
export const edit = <InlineEdit {...props} />
// @ts-expect-error The editable input needs a label.
export const unnamed = <InlineEdit value="Draft" />

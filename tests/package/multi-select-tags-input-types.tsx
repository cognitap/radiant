import { createRef } from 'react'
import {
  Combobox,
  ComboboxTags,
  ComboboxInput,
  useCombobox,
  MultiSelect,
  MultiSelectTags,
  MultiSelectInput,
  MultiSelectPortal,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectClear,
  useMultiSelect,
  TagsInput,
  Tag,
  defineTheme,
  type ComboboxProps,
  type MultiSelectProps,
  type TagsInputProps,
  type TagProps
} from '@cognitap/radiant'
export const multiple = (
  <Combobox
    multiple
    items={[{ value: 'a', label: 'Alpha' }]}
    value={['a']}
    selectedItems={[{ value: 'remote', label: 'Remote' }]}
    onValueChange={values => values.map(value => value.toUpperCase())}
  >
    <ComboboxTags />
    <ComboboxInput />
  </Combobox>
)
export const facade = (
  <MultiSelect
    items={[{ value: 'a', label: 'Alpha' }]}
    defaultValue={['a']}
    name="projects"
    readOnly
  >
    <MultiSelectTags ref={createRef<HTMLDivElement>()} />
    <MultiSelectInput ref={createRef<HTMLInputElement>()} />
    <MultiSelectClear render={props => <button {...props} />} />
    <MultiSelectPortal>
      <MultiSelectContent ref={createRef<HTMLDivElement>()}>
        <MultiSelectItem value="a">Alpha</MultiSelectItem>
      </MultiSelectContent>
    </MultiSelectPortal>
  </MultiSelect>
)
export const entry = (
  <TagsInput
    ref={createRef<HTMLInputElement>()}
    value={['design']}
    onValueChange={values => values.map(value => value.length)}
    separators={[',', ';']}
    validate={value => value.length > 2 || 'Use three characters.'}
    maxCount={4}
    name="topics"
    size={20}
    controlSize="small"
    readOnly
    parts={{
      wrapper: { style: { gap: 8 } },
      tag: { className: 'custom' },
      remove: { style: { borderRadius: 4 } },
      error: { className: 'error' }
    }}
  />
)
export const tag = (
  <Tag
    ref={createRef<HTMLSpanElement>()}
    removeLabel="Remove design"
    onRemove={event => event.preventDefault()}
    pending
    tone="accent"
    parts={{ remove: { style: { padding: 0 } } }}
  >
    Design
  </Tag>
)
function Hooks() {
  const single = useCombobox()
  const scalar: string | null | undefined = single?.value
  single?.setValue(null)
  const multiple = useCombobox({ multiple: true })
  const values: string[] | undefined = multiple?.value
  multiple?.setValue([])
  useMultiSelect()?.setValue(['a'])
  void scalar
  void values
  return null
}
defineTheme({
  id: 'tags',
  name: 'Tags',
  components: { tag: { gap: '4px' }, multiSelect: { gap: '8px' }, tagsInput: { gap: '6px' } }
})
// @ts-expect-error multiple selection requires an array
const scalarMultiple: ComboboxProps = { multiple: true, items: [], value: 'a' }
// @ts-expect-error arrays need explicit multiple mode
const arraySingle: ComboboxProps = { items: [], value: ['a'] }
// @ts-expect-error exactly one multiple selection owner
const mixed: MultiSelectProps = { items: [], value: [], defaultValue: [] }
// @ts-expect-error the facade cannot disable multiple mode
const singleFacade: MultiSelectProps = { items: [], multiple: false }
// @ts-expect-error tags use array state
const textValue: TagsInputProps = { value: 'design' }
// @ts-expect-error exactly one TagsInput owner
const mixedEntry: TagsInputProps = { value: [], defaultValue: [] }
// @ts-expect-error Input type belongs to free text editing
const numericEntry: TagsInputProps = { type: 'number' }
// @ts-expect-error validation feedback is styled through parts.error
const messagePart: TagsInputProps = { parts: { message: {} } }
// @ts-expect-error Tag removal must have an explicit accessible label
const unnamed: TagProps = { children: 'Design', onRemove: () => {} }
const decorative: TagProps = {
  children: 'Design',
  removeLabel: 'Remove',
  onRemove: () => {},
  // @ts-expect-error Tag is operable, so it cannot be decorative
  decorative: true
}
void Hooks
void scalarMultiple
void arraySingle
void mixed
void singleFacade
void textValue
void mixedEntry
void numericEntry
void messagePart
void unnamed
void decorative

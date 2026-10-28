import { createRef } from 'react'
import {
  Field,
  Select,
  SelectTrigger,
  SelectValue,
  SelectPortal,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemText,
  SelectItemIndicator,
  type SelectProps,
  type SelectOption
} from '@cognitap/radiant'

const items: readonly SelectOption[] = [
  { value: '', label: 'None' },
  { value: 'team', label: <span>Our team</span>, textValue: 'Our team' }
]
const selection: SelectProps = {
  items,
  value: null,
  onValueChange(value) {
    const next: string | null = value
    void next
  },
  open: false
}
export const example = (
  <Field label="Workspace">
    <Select
      {...selection}
      name="workspace"
      form="profile"
    >
      <SelectTrigger
        ref={createRef<HTMLButtonElement>()}
        render={resolved => <button {...resolved} />}
      >
        <SelectValue placeholder="Choose" />
      </SelectTrigger>
      <SelectPortal>
        <SelectContent
          position="popper"
          motion="off"
          ref={createRef<HTMLDivElement>()}
        >
          <SelectViewport>
            <SelectItem value="team">
              <SelectItemText />
              <SelectItemIndicator />
            </SelectItem>
          </SelectViewport>
        </SelectContent>
      </SelectPortal>
    </Select>
  </Field>
)
// @ts-expect-error One value owner per mount.
const mixed: SelectProps = { items, value: 'team', defaultValue: '' }
// @ts-expect-error One open-state owner per mount.
const mixedOpen: SelectProps = { items, open: true, defaultOpen: false }
// @ts-expect-error Single selection uses strings or null, never arrays.
const multiple: SelectProps = { items, value: ['team'] }
// @ts-expect-error Rich labels need explicit keyboard/native text.
const unnamed: SelectOption = { value: 'team', label: <span>Team</span> }
void [mixed, mixedOpen, multiple, unnamed]
// @ts-expect-error Disabled belongs to Select/Field so its form bridge and trigger agree.
export const disabledPart = <SelectTrigger disabled />

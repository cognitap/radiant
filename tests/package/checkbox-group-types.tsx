import { createElement as h, createRef } from 'react'
import {
  CheckboxGroup,
  type CheckboxGroupItem,
  type CheckboxGroupSelectAll
} from '@cognitap/radiant'
const items: CheckboxGroupItem[] = [
  {
    value: 'email',
    label: 'Email',
    ref: createRef<HTMLInputElement>(),
    style: { borderRadius: '4px' }
  },
  { value: 'sms', label: 'SMS', disabled: true }
]
const selectAll: CheckboxGroupSelectAll = {
  label: 'All available',
  ref: createRef<HTMLInputElement>()
}
h(CheckboxGroup, {
  legend: 'Notifications',
  items,
  selectAll,
  name: 'channels',
  defaultValue: ['email'],
  ref: createRef<HTMLFieldSetElement>(),
  form: 'preferences',
  style: { '--rad-checkbox-group-gap': '1rem' },
  parts: { options: { className: 'gap-4' }, legend: { className: 'italic' } }
})
h(CheckboxGroup, {
  legend: 'Channels',
  items,
  value: ['email'],
  onValueChange: values => values.push('sms')
})
// @ts-expect-error Choose one value owner.
h(CheckboxGroup, { legend: 'Channels', items, value: [], defaultValue: [] })
// @ts-expect-error Item state belongs to the group.
const invalid: CheckboxGroupItem = { value: 'email', label: 'Email', checked: true }
void invalid
// @ts-expect-error Select all is never submitted.
const invalidAll: CheckboxGroupSelectAll = { label: 'All', name: 'all' }
void invalidAll

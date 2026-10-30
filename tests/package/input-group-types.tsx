import { createRef } from 'react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
  type InputGroupProps,
  type InputGroupInputProps,
  type InputGroupTextareaProps,
  type InputGroupAddonProps
} from '@cognitap/radiant'
const root: InputGroupProps = {
  controlSize: 'small',
  dir: 'rtl',
  ref: createRef<HTMLDivElement>(),
  style: { '--rad-input-group-gap': '4px' }
}
const input: InputGroupInputProps = {
  value: 'reader',
  onChange: () => {},
  ref: createRef<HTMLInputElement>(),
  'aria-label': 'Project'
}
const textarea: InputGroupTextareaProps = {
  defaultValue: 'Reviewed',
  rows: 4,
  ref: createRef<HTMLTextAreaElement>(),
  style: { color: 'red' }
}
const addon: InputGroupAddonProps = {
  ref: createRef<HTMLDivElement>(),
  'aria-hidden': true,
  style: { gap: '2px' }
}
export const text = (
  <InputGroup {...root}>
    <InputGroupAddon {...addon}>https://</InputGroupAddon>
    <InputGroupInput {...input} />
  </InputGroup>
)
export const multiline = (
  <InputGroup {...root}>
    <InputGroupTextarea {...textarea} />
  </InputGroup>
)
// @ts-expect-error Native input has one value owner.
export const mixed: InputGroupInputProps = { value: 'a', defaultValue: 'b' }
// @ts-expect-error Native textarea initial content uses defaultValue.
export const children: InputGroupTextareaProps = { children: 'Reviewed' }
// @ts-expect-error The group does not own a value.
export const value: InputGroupProps = { value: 'reader' }
// @ts-expect-error Ref targets the actual native input.
export const wrongRef: InputGroupInputProps = { ref: createRef<HTMLTextAreaElement>() }

import { createElement, createRef } from 'react'
import { Field, Switch, defineTheme, type SwitchProps } from '@cognitap/radiant'

const props: SwitchProps = {
  name: 'notifications',
  form: 'preferences',
  value: 'enabled',
  checked: false,
  controlSize: 'small',
  ref: createRef<HTMLInputElement>(),
  style: { '--rad-switch-width': '3rem' },
  parts: {
    wrapper: { className: 'gap-4' },
    label: { style: { fontStyle: 'italic' } },
    indicator: { style: { borderRadius: 0 } }
  },
  onChange(event) {
    const enabled: boolean = event.target.checked
    void enabled
  },
  onBlur(event) {
    event.currentTarget.focus()
  }
}
createElement(Field, { label: 'Notifications' }, createElement(Switch, props))
createElement(Switch, {
  label: 'Backups',
  defaultChecked: true,
  ref: node => {
    node?.focus()
    return () => {}
  }
})
defineTheme({
  id: 'switch',
  name: 'Switch',
  components: {
    switch: { height: '1.5rem', width: '3rem', thumbRadius: '999px', checkedThumb: 'white' }
  }
})
// @ts-expect-error There is one checked owner, including false.
const mixed: SwitchProps = { checked: false, defaultChecked: true }
// @ts-expect-error Switch is binary; use Checkbox for mixed selection.
const indeterminate: SwitchProps = { indeterminate: true }
// @ts-expect-error The native type is fixed.
const type: SwitchProps = { type: 'radio' }
// @ts-expect-error The switch role is fixed.
const role: SwitchProps = { role: 'checkbox' }
// @ts-expect-error Native checked state supplies accessibility state.
const aria: SwitchProps = { 'aria-checked': 'mixed' }
// @ts-expect-error Native checkbox inputs do not implement readOnly.
const readonly: SwitchProps = { readOnly: true }
// @ts-expect-error The ref targets the native input, never a wrapper/button.
const wrongRef: SwitchProps = { ref: createRef<HTMLButtonElement>() }
// @ts-expect-error Styling parts cannot replace relationships.
const part: SwitchProps = { parts: { label: { id: 'other' } } }
// @ts-expect-error Shared control sizes use the closed vocabulary.
const size: SwitchProps = { controlSize: 'default' }
// @ts-expect-error Theme slots are explicit.
defineTheme({ id: 'bad-switch', name: 'Bad', components: { switch: { size: '2rem' } } })
void [mixed, indeterminate, type, role, aria, readonly, wrongRef, part, size]

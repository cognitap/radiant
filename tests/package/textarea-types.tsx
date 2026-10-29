import { createElement, createRef } from 'react'
import { Field, Textarea, defineTheme, type TextareaProps } from '@cognitap/radiant'

const props: TextareaProps = {
  name: 'notes',
  form: 'profile',
  rows: 4,
  cols: 40,
  wrap: 'hard',
  maxLength: 300,
  minLength: 2,
  autoComplete: 'off',
  spellCheck: true,
  dirName: 'notes.dir',
  controlSize: 'small',
  value: 'A\nB',
  ref: createRef<HTMLTextAreaElement>(),
  style: { '--rad-textarea-radius': '12px', resize: 'none' },
  onChange(event) {
    event.currentTarget.setSelectionRange(0, 2)
  },
  onBlur(event) {
    event.currentTarget.reportValidity()
  }
}
createElement(Field, { label: 'Notes' }, createElement(Textarea, props))
createElement(Textarea, {
  defaultValue: 'Draft',
  ref: node => {
    node?.focus()
    return () => {}
  }
})
defineTheme({
  id: 'textarea',
  name: 'Textarea',
  components: {
    textarea: { minHeight: '4rem', paddingBlock: '.5rem', radius: '1rem', fontWeight: 500 }
  }
})
// @ts-expect-error Textarea has one value owner.
const mixed: TextareaProps = { value: '', defaultValue: '' }
// @ts-expect-error Empty controlled text uses an empty string.
const nullValue: TextareaProps = { value: null }
// @ts-expect-error Textarea refs point at the native textarea.
const wrongRef: TextareaProps = { ref: createRef<HTMLInputElement>() }
// @ts-expect-error Native rows remain numeric.
const wrongRows: TextareaProps = { rows: 'large' }
// @ts-expect-error Textarea has no native input type.
const wrongType: TextareaProps = { type: 'text' }
// @ts-expect-error Use defaultValue for initial text.
const children: TextareaProps = { children: 'initial' }
// @ts-expect-error Visual sizing uses the shared vocabulary.
const wrongSize: TextareaProps = { controlSize: 'default' }
// @ts-expect-error Textarea override names are closed.
defineTheme({ id: 'bad-textarea', name: 'Bad', components: { textarea: { heightPx: 50 } } })
void [mixed, nullValue, wrongRef, wrongRows, wrongType, children, wrongSize]

import { createElement, createRef } from 'react'
import { Field, Slider, defineTheme, type SliderProps } from '@cognitap/radiant'

const props: SliderProps = {
  name: 'volume',
  form: 'preferences',
  value: 40,
  min: 0,
  max: 100,
  step: 5,
  orientation: 'vertical',
  controlSize: 'small',
  ref: createRef<HTMLInputElement>(),
  style: { '--rad-slider-thumb-size': '1.5rem' },
  'aria-valuetext': '40 percent',
  onChange(event) {
    const value: number = event.target.valueAsNumber
    void value
  }
}
createElement(Field, { label: 'Volume' }, createElement(Slider, props))
createElement(Slider, { defaultValue: 0.5, min: 0, max: 1, step: 0.05 })
defineTheme({
  id: 'slider',
  name: 'Slider',
  components: { slider: { thumbSize: '1.5rem', trackSize: '.5rem', focusWidth: '3px' } }
})
// @ts-expect-error A slider has one numeric value owner.
const mixed: SliderProps = { value: 0, defaultValue: 50 }
// @ts-expect-error Single-thumb scope has one number.
const multiple: SliderProps = { value: [10, 90] }
// @ts-expect-error Values are numeric; native valueAsNumber reads changes.
const text: SliderProps = { value: '40' }
// @ts-expect-error Native range type is fixed.
const type: SliderProps = { type: 'number' }
// @ts-expect-error Keep the implicit native slider role.
const role: SliderProps = { role: 'spinbutton' }
// @ts-expect-error Native range supplies accessible values.
const aria: SliderProps = { 'aria-valuenow': 20 }
// @ts-expect-error Range always has a value, so required does not apply.
const required: SliderProps = { required: true }
// @ts-expect-error Native range has no read-only mode.
const readonly: SliderProps = { readOnly: true }
// @ts-expect-error Orientation is explicit.
const orientation: SliderProps = { orientation: 'diagonal' }
// @ts-expect-error The ref is the input, never a wrapper.
const ref: SliderProps = { ref: createRef<HTMLDivElement>() }
void [mixed, multiple, text, type, role, aria, required, readonly, orientation, ref]

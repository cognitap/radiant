import { ColorPicker, type ColorFormat } from '@cognitap/radiant'

const format: ColorFormat = 'oklch'
export const picker = (
  <ColorPicker
    label="Accent"
    value="#ABC"
    format={format}
    onValueChange={next => next.trim()}
  />
)

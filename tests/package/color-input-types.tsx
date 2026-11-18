import { ColorInput, Field, type ColorInputProps } from '@cognitap/radiant'

export const accent = (
  <Field label="Accent">
    <ColorInput
      name="accent"
      format="oklch"
      required
      defaultValue="#405CE0"
    />
  </Field>
)
// @ts-expect-error A color input has one value owner.
export const ambiguous: ColorInputProps = { value: '#ABC', defaultValue: '#ABC' }

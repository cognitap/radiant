import { Field, RangeSlider, type RangeSliderValue } from '@cognitap/radiant'

const range: RangeSliderValue = [20, 80]
;<Field label="Price">
  <RangeSlider
    name="price"
    lowerLabel="Minimum price"
    upperLabel="Maximum price"
    value={range}
    onValueChange={next => {
      const value: number = next[1]
      void value
    }}
  />
</Field>
;<RangeSlider
  aria-label="Price"
  lowerLabel="Minimum"
  upperLabel="Maximum"
  // @ts-expect-error A range has exactly two values.
  value={[2]}
/>
// @ts-expect-error A thumb needs its own accessible name.
;<RangeSlider
  aria-label="Price"
  lowerLabel="Minimum"
/>

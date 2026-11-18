import { Rating, type RatingProps } from '@cognitap/radiant'

export const formRating = (
  <Rating
    label="Service"
    value={3}
    onValueChange={value => value.toFixed()}
    name="score"
    required
  />
)
// @ts-expect-error A rating has one value owner.
export const ambiguous: RatingProps = { label: 'Service', value: 3, defaultValue: 2 }

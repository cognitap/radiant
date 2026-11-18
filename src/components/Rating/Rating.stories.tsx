import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../Button/Button.js'
import { LocaleProvider } from '../LocaleProvider/LocaleProvider.js'
import { Rating } from './Rating.js'

const meta = {
  title: 'Components/Rating',
  component: Rating,
  args: { label: 'Delivery experience', defaultValue: 3 },
  parameters: {
    docs: {
      description: {
        component:
          'Choose a whole-number score with native radios, or display a read-only rating. Supply formatted value text and optional custom marks.'
      }
    }
  }
} satisfies Meta<typeof Rating>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

function ReviewDelivery() {
  const [score, setScore] = useState('')
  return (
    <form
      className="grid gap-3"
      onReset={() => setScore('')}
      onSubmit={event => {
        event.preventDefault()
        setScore(String(new FormData(event.currentTarget).get('score')))
      }}
    >
      <Rating
        label="Rate this delivery"
        name="score"
        required
      />
      <div className="flex gap-2">
        <Button type="submit">Send rating</Button>
        <Button
          type="reset"
          variant="outline"
        >
          Reset
        </Button>
      </div>
      <output className="text-sm">{score && `Submitted ${score} out of 5`}</output>
    </form>
  )
}
export const ReviewADelivery: Story = { render: () => <ReviewDelivery /> }
export const ShowAStoreRating: Story = {
  args: { label: 'Store rating', readOnly: true, defaultValue: 4 }
}
export const RateAWorkshopInHebrew: Story = {
  render: () => (
    <LocaleProvider locale="he-IL">
      <Rating
        label="דירוג הסדנה"
        formatValue={(value, max) => `${value} מתוך ${max}`}
        defaultValue={2}
      />
    </LocaleProvider>
  )
}

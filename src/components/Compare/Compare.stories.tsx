import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Button,
  Compare,
  CompareItem,
  CompareItemBody,
  CompareItemFooter,
  CompareItemHeader,
  type CompareProps
} from '../../index.js'

const meta = {
  title: 'Components/Compare',
  component: Compare,
  args: { gap: 'normal' },
  argTypes: { gap: { control: 'inline-radio', options: ['tight', 'normal', 'airy'] } },
  parameters: {
    docs: {
      description: {
        component:
          'A list of two to four CompareItems, each with CompareItemHeader, CompareItemBody and CompareItemFooter parts. Compare is an inline-size container: items stack until it is 32rem wide (48rem for four), then sit side by side with headers, bodies and footers on shared rows.'
      }
    }
  }
} satisfies Meta<typeof Compare>

export default meta
type Story = StoryObj<typeof meta>

const plans = [
  { name: 'Basic', price: 'Free', detail: 'One learner.' },
  {
    name: 'Plus',
    price: '€8 a month',
    detail: 'One learner, offline lessons and weekly reports by email.'
  },
  { name: 'Team', price: '€40 a month', detail: 'Up to ten learners.' },
  { name: 'School', price: 'Ask us', detail: 'Whole classes.' }
]

const itemClass =
  'rounded-[var(--rad-surface-radius,0.75rem)] border border-[var(--rad-color-border,oklch(0.885_0.005_286))] p-[var(--rad-spacing-normal,1rem)]'

function Plans({ width, count = 3, ...props }: CompareProps & { width: string; count?: number }) {
  return (
    <div style={{ width, maxWidth: '100%' }}>
      <Compare {...props}>
        {plans.slice(0, count).map(plan => (
          <CompareItem
            key={plan.name}
            className={itemClass}
          >
            <CompareItemHeader>
              <strong>{plan.name}</strong>
              <div>{plan.price}</div>
            </CompareItemHeader>
            <CompareItemBody>{plan.detail}</CompareItemBody>
            <CompareItemFooter>
              <Button>Choose {plan.name}</Button>
            </CompareItemFooter>
          </CompareItem>
        ))}
      </Compare>
    </div>
  )
}

export const Default: Story = {
  render: args => (
    <Plans
      {...args}
      width="720px"
    />
  )
}

export const Widths: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The same Compare at 360px and 720px. The footers line up although the bodies differ.'
      }
    }
  },
  render: args => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <Plans
        {...args}
        width="360px"
      />
      <Plans
        {...args}
        width="720px"
      />
    </div>
  )
}

export const FourItems: Story = {
  parameters: {
    docs: { description: { story: 'Four items wait for 48rem before sharing a row.' } }
  },
  render: args => (
    <Plans
      {...args}
      count={4}
      width="720px"
    />
  )
}

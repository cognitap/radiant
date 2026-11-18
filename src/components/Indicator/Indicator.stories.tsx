import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Avatar } from '../Avatar/Avatar.js'
import { Button } from '../Button/Button.js'
import { Indicator } from './Indicator.js'

const meta = {
  title: 'Components/Indicator',
  component: Indicator,
  args: {
    label: 'Inbox',
    statusText: '12 unread messages',
    count: 12,
    children: props => (
      <Button
        {...props}
        variant="outline"
      >
        Inbox
      </Button>
    )
  }
} satisfies Meta<typeof Indicator>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const ShowTeammateAvailability: Story = {
  args: {
    label: 'Mina Chen',
    statusText: 'Online',
    count: undefined,
    position: 'bottom-end',
    offset: -3,
    children: props => (
      <Avatar
        alt={props['aria-label']}
        fallback="MC"
      />
    )
  }
}

function InboxCounter() {
  const [count, setCount] = useState(105)
  return (
    <Indicator
      label="Inbox"
      statusText={`${count} unread messages`}
      count={count}
    >
      {props => (
        <Button
          {...props}
          onClick={() => setCount(value => Math.max(0, value - 1))}
        >
          Inbox
        </Button>
      )}
    </Indicator>
  )
}

export const ReadUnreadMessages: Story = { render: () => <InboxCounter /> }

export const FlagOrdersInAGrid: Story = {
  render: () => (
    <div className="grid w-72 max-w-full gap-3">
      <Indicator
        label="Orders"
        statusText="142 orders to review"
        count={142}
        maxCount={9}
        tone="warning"
      >
        {target => (
          <Button
            {...target}
            variant="outline"
          >
            Orders
          </Button>
        )}
      </Indicator>
      <p>Review orders before the next shipping cutoff.</p>
    </div>
  )
}

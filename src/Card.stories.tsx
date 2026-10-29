import { useId, useState } from 'react'
import { CardDashboardExample } from '../.storybook/examples/CardExamples.js'
import { ProfileExample } from '../.storybook/examples/ProfileForm.js'
import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Link
} from './index.js'
import { themes } from './examples/index.js'

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    docs: {
      description: {
        component:
          'A passive div surface with CardHeader, CardTitle, CardDescription, CardContent and CardFooter parts. Each part accepts native props, className, typed local theme styles and ref on its host; caller data-slot tokens add to the owned identity. Shared color motion respects reduced motion; data-slot values are card, card-header, card-title, card-description, card-content and card-footer. Title defaults to h2 and accepts level. Put Button/Link actions inside; Card has no disabled, pending or open state.'
      }
    }
  }
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

function ShippingCard() {
  const id = useId()
  const [tracking, setTracking] = useState(false)

  return (
    <Card style={{ maxWidth: '24rem' }}>
      <CardHeader>
        <CardTitle>Shipping</CardTitle>
        <CardDescription>Leaves the studio tomorrow.</CardDescription>
      </CardHeader>
      <CardContent>
        <p
          id={`${id}-details`}
          tabIndex={-1}
          className="target:[outline:var(--rad-focus-width)_var(--rad-focus-style)_var(--rad-color-focus)] target:[outline-offset:var(--rad-focus-offset)]"
          style={{ margin: 0 }}
        >
          Ships in two days. The blue set is packed.
        </p>
        <output style={{ display: 'block', marginTop: tracking ? '0.75rem' : 0 }}>
          {tracking ? 'Tracking update: the package is being prepared for dispatch.' : null}
        </output>
      </CardContent>
      <CardFooter>
        <Button
          type="button"
          onClick={() => setTracking(true)}
        >
          Track
        </Button>
        <Link href={`#${id}-details`}>Details</Link>
      </CardFooter>
    </Card>
  )
}

export const Default: Story = {
  render: () => <ShippingCard />
}

export const Composition: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The canonical native profile form, reused inside Card. Fields and Button actions follow the global theme; the same form can also be placed inside Dialog under Recipes → Forms.'
      }
    }
  },
  render: () => (
    <ProfileExample
      owner="native"
      placement="card"
    />
  )
}

export const Customisation: Story = {
  render: () => (
    <Card
      data-slot="product"
      style={{ maxWidth: '24rem', '--rad-card-padding': '1.25rem' }}
    >
      <div
        style={{
          height: '4.5rem',
          borderRadius: '0.5rem',
          background: 'linear-gradient(120deg, oklch(0.85 0.08 200), oklch(0.9 0.06 40))'
        }}
      />
      <CardContent>The content can sit before the title.</CardContent>
      <CardTitle
        level={3}
        style={{ '--rad-card-title-size': '1.25rem' }}
      >
        Soft set
      </CardTitle>
    </Card>
  )
}

export const Quiet: Story = {
  render: () => (
    <Card style={{ maxWidth: '24rem' }}>
      <CardHeader>
        <CardTitle>Studio note</CardTitle>
        <CardDescription>No action on this card.</CardDescription>
      </CardHeader>
      <CardContent>The glaze fires overnight.</CardContent>
    </Card>
  )
}

export const ProjectDashboard: Story = {
  render: (_, { globals }) => (
    <CardDashboardExample
      theme={themes.find(theme => theme.id === globals.theme)}
      mode={globals.mode === 'light' || globals.mode === 'dark' ? globals.mode : 'system'}
    />
  )
}

export const StaticDashboard: Story = {
  render: (_, { globals }) => (
    <CardDashboardExample
      staticMotion
      theme={themes.find(theme => theme.id === globals.theme)}
      mode={globals.mode === 'light' || globals.mode === 'dark' ? globals.mode : 'system'}
    />
  )
}

import { useId, useState } from 'react'
import { CardDashboardExample, CardLinkExample } from '../.storybook/examples/CardExamples.js'
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
          'A passive div surface with CardHeader, CardTitle, CardDescription, CardContent and CardFooter parts. Each part takes native props, className, theme styles and ref. CardTitle renders h2 by default; level picks h1 to h6. Card has no state of its own: put Button, Link or a form inside.'
      }
    }
  }
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
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

export const WithActions: Story = {
  render: () => <ShippingCard />
}

export const LinkCard: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The whole card opens one link. The link sits in CardTitle, so its name is the title alone; its ::after covers the relative Card. Keep other controls out of a link card.'
      }
    }
  },
  render: () => <CardLinkExample />
}

export const WithForm: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The shared profile form inside Card. The form owns submission; Card adds only the surface.'
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

export const ProjectDashboard: Story = {
  render: (_, { globals }) => (
    <CardDashboardExample
      theme={themes.find(theme => theme.id === globals.theme)}
      mode={globals.mode === 'light' || globals.mode === 'dark' ? globals.mode : 'system'}
    />
  )
}

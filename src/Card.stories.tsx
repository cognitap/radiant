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

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    docs: {
      description: {
        component:
          'A passive div surface with CardHeader, CardTitle, CardDescription, CardContent and CardFooter parts. Each part accepts native props, className/style and ref on its host; data-slot values are card, card-header, card-title, card-description, card-content and card-footer. Title defaults to h2 and accepts level. Put Button/Link actions inside; Card has no disabled, pending or open state.'
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
        <CardTitle>Shipping</CardTitle>
        <CardDescription>Leaves the studio tomorrow.</CardDescription>
      </CardHeader>
      <CardContent>
        <p style={{ margin: 0 }}>Ships in two days. The blue set is packed.</p>
      </CardContent>
      <CardFooter>
        <Button type="button">Track</Button>
        <Link href="/orders/1">Details</Link>
      </CardFooter>
    </Card>
  )
}

export const Composition: Story = {
  render: () => (
    <section aria-labelledby="pack-title">
      <Card style={{ maxWidth: '24rem' }}>
        <CardHeader>
          <CardTitle id="pack-title">Pack</CardTitle>
          <CardDescription>The consumer named this section.</CardDescription>
        </CardHeader>
        <CardContent>Three pieces, one box.</CardContent>
      </Card>
    </section>
  )
}

export const Customisation: Story = {
  render: () => (
    <Card style={{ maxWidth: '24rem' }}>
      <div
        style={{
          height: '4.5rem',
          borderRadius: '0.5rem',
          background: 'linear-gradient(120deg, oklch(0.85 0.08 200), oklch(0.9 0.06 40))'
        }}
      />
      <CardContent>The content can sit before the title.</CardContent>
      <CardTitle level={3}>Soft set</CardTitle>
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

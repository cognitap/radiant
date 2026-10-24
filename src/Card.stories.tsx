import type { CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './Card'
import { Link } from './Link'
import { radiantTheme, themes } from './themes/index.js'

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    docs: {
      description: {
        component:
          'A grouped surface. It is not a button or a link. Put a heading in the title, and put actions in the footer as real controls.'
      }
    }
  },
  decorators: [
    (Story, { id }) =>
      id.endsWith('--themes') ? (
        <Story />
      ) : (
        <div style={{ ...radiantTheme, width: '24rem' }}>
          <Story />
        </div>
      )
  ]
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Card>
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

export const Quiet: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Studio note</CardTitle>
        <CardDescription>No action on this card.</CardDescription>
      </CardHeader>
      <CardContent>The glaze fires overnight.</CardContent>
    </Card>
  )
}

export const Region: Story = {
  render: () => (
    <section aria-labelledby="pack-title">
      <Card>
        <CardHeader>
          <CardTitle id="pack-title">Pack</CardTitle>
          <CardDescription>The consumer named this section.</CardDescription>
        </CardHeader>
        <CardContent>Three pieces, one box.</CardContent>
      </Card>
    </section>
  )
}

export const Layout: Story = {
  render: () => (
    <Card>
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

const themeFrame = (surface: string | undefined): CSSProperties => ({
  display: 'grid',
  gap: '1rem',
  padding: '1.5rem',
  borderRadius: '1.25rem',
  background: surface ?? 'oklch(0.985 0.003 250)'
})

export const Themes: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1rem', width: '24rem' }}>
      {themes.map(theme => (
        <div
          key={theme.name}
          style={{ ...theme.style, ...themeFrame(theme.surface) }}
        >
          <Card>
            <CardHeader>
              <CardTitle>{theme.name}</CardTitle>
              <CardDescription>Surface, radius, and corner from the theme.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      ))}
    </div>
  )
}

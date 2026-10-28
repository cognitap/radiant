import { useId, useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
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
  Link,
  themes
} from './index.js'

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
  render: () => <ShippingCard />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const card = canvasElement.querySelector('[data-slot~="card"]')!
    await expect(card.tagName).toBe('DIV')
    await expect(card).not.toHaveAttribute('role')
    await expect(card).not.toHaveAttribute('tabindex')
    await userEvent.click(canvas.getByRole('button', { name: 'Track' }))
    await expect(canvas.getByRole('status')).toHaveTextContent('Tracking update:')
    await expect(canvas.getByRole('link', { name: 'Details' })).toHaveAttribute('data-slot', 'link')
  }
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
  ),
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector('[data-slot~="card"]')!
    await expect(card).toHaveAttribute('data-slot', 'card product')
    await expect(card).toHaveStyle({ padding: '20px' })
    await expect(within(canvasElement).getByRole('heading', { level: 3 })).toHaveStyle({
      fontSize: '20px'
    })
  }
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
  ),
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement)
    const project = within(canvas.getByRole('article', { name: 'Calmer inbox' }))
    const note = project.getByRole('textbox', { name: 'Project note' })
    await expect(note.closest('[data-rad-theme]')).toHaveAttribute('data-rad-theme', globals.theme)
    await userEvent.clear(note)
    await userEvent.type(note, 'Keep the good ideas.')
    await userEvent.click(project.getByRole('button', { name: 'Show details' }))
    await userEvent.click(project.getByRole('button', { name: 'Add step' }))
    await expect(project.getByText('Step 2.', { exact: false })).toBeVisible()
    await userEvent.click(project.getByRole('button', { name: /Move (next|first): Calmer inbox/ }))
    await expect(
      project.getByRole('button', { name: /Move (next|first): Calmer inbox/ })
    ).toHaveFocus()
    await userEvent.click(project.getByRole('button', { name: 'Save note' }))
    await expect(project.getByRole('status')).toHaveTextContent(
      'Saved locally: Keep the good ideas.'
    )
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Stack cards' }))
    await waitFor(async () => {
      await expect(note).toHaveValue('Keep the good ideas.')
    })
  }
}

export const StaticDashboard: Story = {
  render: (_, { globals }) => (
    <CardDashboardExample
      staticMotion
      theme={themes.find(theme => theme.id === globals.theme)}
      mode={globals.mode === 'light' || globals.mode === 'dark' ? globals.mode : 'system'}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('checkbox', { name: 'Turn off spatial motion' })).toBeChecked()
    await expect(canvas.getByRole('checkbox', { name: 'Turn off spatial motion' })).toBeDisabled()
    const project = within(canvas.getByRole('article', { name: 'Launch notes' }))
    await userEvent.click(project.getByRole('button', { name: 'Show details' }))
    await expect(project.getByRole('button', { name: 'Hide details' })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
    await userEvent.click(project.getByRole('button', { name: /Move (next|first): Launch notes/ }))
    await expect(canvasElement.querySelector('[data-project]')).toHaveAttribute(
      'data-project',
      'launch'
    )
  }
}

import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { WorkspaceSettings } from '../.storybook/examples/WorkspaceSettings.js'

const meta = {
  title: 'Recipes/Workspace',
  component: WorkspaceSettings,
  parameters: {
    docs: {
      description: {
        component:
          'One assembled interface across all ten Radiant families. Card contains Accordion and a native Collapsible; Edit profile opens the canonical Field/Input/Checkbox/RadioGroup form in Dialog, whose actions compose Button. Link keeps native navigation. Every part inherits the global theme and mode; no local preset or duplicated form styling.'
      }
    }
  }
} satisfies Meta<typeof WorkspaceSettings>

export default meta
type Story = StoryObj<typeof meta>

export const Settings: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: 'Edit profile' })
    await userEvent.click(trigger)
    const panel = canvas.getByRole('dialog', { name: 'Profile preferences' })
    await expect(panel.querySelector('form')).not.toBeNull()
    await userEvent.click(within(panel).getByRole('button', { name: 'Save profile' }))
    await expect(within(panel).getByRole('alert')).toHaveTextContent('Enter an email.')
    await userEvent.type(within(panel).getByRole('textbox', { name: 'Email' }), 'ada@example.com')
    await userEvent.click(within(panel).getByRole('radio', { name: 'Pro' }))
    await userEvent.click(within(panel).getByRole('button', { name: 'Save profile' }))
    await expect(canvas.getByRole('status')).toHaveTextContent('Saved ada@example.com · pro')
    await expect(trigger).toHaveFocus()
    await userEvent.click(canvas.getByText('Privacy', { exact: true }))
    await userEvent.click(canvas.getByText('Data retention', { exact: true }))
    await expect(
      canvas.getByText('Profile preferences stay until you change or reset them.')
    ).toBeVisible()
    const link = canvas.getByRole('link', { name: 'Read the privacy note' })
    await expect(link).toHaveAttribute('data-slot', 'link')
    const destination = canvas.getByRole('region', { name: 'Privacy note' })
    await expect(link).toHaveAttribute('href', `#${destination.id}`)
  }
}

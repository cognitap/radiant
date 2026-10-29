import type { Meta, StoryObj } from '@storybook/react-vite'
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

export const Settings: Story = {}

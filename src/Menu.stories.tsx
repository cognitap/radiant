import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Menu, MenuTrigger, MenuPortal, MenuContent, MenuItem } from './index.js'
const meta = {
  title: 'Components/Menu',
  component: Menu,
  parameters: {
    docs: {
      description: {
        component:
          'Single-level command menus composed from Popover and Button. Trigger Enter/Space/Down opens the first command; Up opens the last. Arrows wrap, Home/End jump, and typeahead searches labels (textValue for rich labels). Disabled commands remain focusable and cannot activate. Enter/Space/click activate and close unless the handler prevents default. Escape returns to the opener; Tab leaves the menu. Outside dismissal preserves the new target. Native forms and Button render/ref guards are retained. Submenus, menubars, checkable items and context menus are outside this scope. Use Link for navigation.'
      }
    }
  }
} satisfies Meta<typeof Menu>
export default meta
type Story = StoryObj<typeof meta>
function Example({ open = false, custom = false }: { open?: boolean; custom?: boolean }) {
  const [result, setResult] = useState('No command selected.')
  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <Menu defaultOpen={open}>
        <MenuTrigger variant="outline">Project commands</MenuTrigger>
        <MenuPortal>
          <MenuContent
            style={
              custom
                ? {
                    '--rad-menu-width': '18rem',
                    '--rad-menu-padding': '.75rem',
                    '--rad-menu-item-radius': '1rem'
                  }
                : undefined
            }
          >
            <MenuItem onSelect={() => setResult('Renamed locally.')}>Rename</MenuItem>
            <MenuItem onSelect={() => setResult('Duplicated locally.')}>Duplicate</MenuItem>
            <MenuItem disabled>Archive · owner only</MenuItem>
          </MenuContent>
        </MenuPortal>
      </Menu>
      <output>{result}</output>
    </div>
  )
}
export const Default: Story = {
  render: (_, { viewMode }) => <Example open={viewMode !== 'docs'} />
}
export const Customisation: Story = {
  render: (_, { viewMode }) => (
    <Example
      open={viewMode !== 'docs'}
      custom
    />
  )
}
export const Commands: Story = { render: () => <Example /> }

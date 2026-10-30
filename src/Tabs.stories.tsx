import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  TabsControlledExample,
  TabsDisabledExample,
  TabsExample,
  TabsOverflowExample,
  TabsSizeComparison,
  TabsWorkspaceExample
} from '../.storybook/examples/TabsExamples.js'

const meta = {
  title: 'Components/Tabs',
  component: TabsExample,
  args: {
    activationMode: 'automatic',
    orientation: 'horizontal',
    loop: true,
    disabled: false,
    controlSize: 'medium'
  },
  argTypes: {
    activationMode: { control: 'inline-radio', options: ['automatic', 'manual'] },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] }
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Composable Tabs, TabsList, TabsTrigger and TabsContent. Set value/onValueChange or defaultValue to an existing tab. Arrow keys move through enabled tabs in DOM order; Home/End move to the ends, with RTL and vertical navigation. Automatic activation selects on focus; manual activation waits for click, Enter or Space and suits panels that load on demand. Triggers compose Button and retain its native events/ref/render contract, with independent Tabs presentation. The selected trigger has data-selected. Inactive panels are hidden and their children unmount by default; keepMounted preserves local state inside a hidden, inert panel. Panel hosts and owned IDs remain stable for SSR/hydration. A tab list needs an accessible label; panel tabIndex defaults to zero. A horizontal list scrolls when its tabs overflow. Form reset does not reset tab selection.'
      }
    }
  }
} satisfies Meta<typeof TabsExample>
export default meta
type Story = StoryObj<typeof meta>

const fixed = { parameters: { controls: { disable: true } } }

export const Default: Story = {}
export const Controlled: Story = { ...fixed, render: () => <TabsControlledExample /> }
export const ManualActivation: Story = { args: { activationMode: 'manual' } }
export const Vertical: Story = { args: { orientation: 'vertical' } }
export const Disabled: Story = { ...fixed, render: () => <TabsDisabledExample /> }
export const Overflow: Story = { ...fixed, render: () => <TabsOverflowExample /> }
export const RightToLeft: Story = { args: { dir: 'rtl' } }
export const WorkspaceSettings: Story = { ...fixed, render: () => <TabsWorkspaceExample /> }
export const Customisation: Story = {
  args: {
    style: {
      '--rad-tabs-list-radius': '999px',
      '--rad-tabs-trigger-radius': '999px',
      '--rad-tabs-list-gap': '.5rem',
      '--rad-tabs-content-padding': '1.5rem'
    }
  }
}
export const SharedControlSizes: Story = { ...fixed, render: () => <TabsSizeComparison /> }

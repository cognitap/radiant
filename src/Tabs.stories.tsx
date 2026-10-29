import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  TabsExample,
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
          'Composable Tabs, TabsList, TabsTrigger and TabsContent. Set value/onValueChange or defaultValue to an existing tab. Arrow keys move through enabled tabs in DOM order; Home/End move to the ends, with RTL and vertical navigation. Automatic activation selects on focus; manual activation waits for click, Enter or Space and suits panels that load on demand. Triggers compose Button and retain its native events/ref/render contract, with independent Tabs presentation. Inactive panel children unmount by default; keepMounted preserves local state inside a hidden, inert panel. Panel hosts and owned IDs remain stable for SSR/hydration. A tab list needs an accessible label; panel tabIndex defaults to zero. Form reset does not reset tab selection.'
      }
    }
  }
} satisfies Meta<typeof TabsExample>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const ManualActivation: Story = { args: { activationMode: 'manual' } }
export const Vertical: Story = { args: { orientation: 'vertical' } }
export const RightToLeft: Story = { args: { dir: 'rtl' } }
export const Disabled: Story = { args: { disabled: true } }
export const DisabledTab: Story = { args: { disabledActivity: true } }
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
export const WorkspaceSettings: Story = {
  parameters: { controls: { disable: true } },
  render: () => <TabsWorkspaceExample />
}
export const SharedControlSizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => <TabsSizeComparison />
}

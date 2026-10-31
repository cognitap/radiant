import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { MotionProvider } from './motion/react.js'
import {
  ControlledFilters,
  ProjectSettings,
  ReportOutline,
  ReviewOrder,
  type DrawerOptions
} from '../.storybook/examples/DrawerExamples.js'
const meta = {
  title: 'Components/Drawer',
  component: ProjectSettings,
  args: {
    side: 'end',
    dir: 'ltr',
    motion: 'inherit',
    modal: true,
    closeOnBackdrop: true,
    closeOnEscape: true,
    initialOpen: false,
    initialSize: 1,
    disabled: false,
    pending: false
  },
  argTypes: {
    side: { control: 'inline-radio', options: ['top', 'right', 'bottom', 'left', 'start', 'end'] },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] },
    motion: { control: 'inline-radio', options: ['inherit', 'off'] },
    initialSize: { control: 'inline-radio', options: [0.5, 1] }
  },
  render: args => <ProjectSettings {...args} />
} satisfies Meta<DrawerOptions>
export default meta
type Story = StoryObj<typeof meta>
async function settled(canvasElement: HTMLElement, point = 1) {
  await waitFor(
    () => {
      const node = canvasElement.querySelector('dialog')!
      expect(node.open).toBe(true)
      const side = node.getAttribute('data-physical-side')
      expect(parseFloat(node.style.getPropertyValue('--_rad-drawer-shift'))).toBe(
        (side === 'left' || side === 'top' ? -1 : 1) * (1 - point) * 100
      )
    },
    { timeout: 4000 }
  )
}
export const Default: Story = {}
export const Controlled: Story = {
  render: () => <ControlledFilters />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Open filters at half size' }))
    await settled(canvasElement, 0.5)
    expect(canvas.getByText('Filters are open at 50%.')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Resize filters' }))
    await settled(canvasElement, 1)
    expect(canvas.getByText('Filters are open at 100%.')).toBeVisible()
  }
}
export const EditProjectSettings: Story = {
  args: { initialOpen: true },
  render: args => (
    <MotionProvider>
      <ProjectSettings {...args} />
    </MotionProvider>
  ),
  play: async ({ canvasElement, args }) => {
    await settled(canvasElement, args.initialSize)
    expect(within(canvasElement).getByRole('dialog', { name: 'Project settings' })).toBeVisible()
  }
}
export const ReadReportOutline: Story = {
  args: { initialOpen: true, modal: false, side: 'start', initialSize: 0.5 },
  render: args => (
    <MotionProvider>
      <ReportOutline {...args} />
    </MotionProvider>
  ),
  play: async ({ canvasElement, args }) => settled(canvasElement, args.initialSize)
}
export const ReviewAnOrder: Story = {
  args: { initialOpen: true, side: 'bottom' },
  render: args => (
    <MotionProvider>
      <ReviewOrder {...args} />
    </MotionProvider>
  ),
  play: async ({ canvasElement, args }) => settled(canvasElement, args.initialSize)
}

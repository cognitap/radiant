import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { InlineCode, type InlineCodeProps } from './InlineCode.js'
import { MotionProvider } from './motion/react.js'
import {
  InstallRadiant,
  ConfigureStudyExport,
  InspectSessionExport
} from '../.storybook/examples/CodeBlockExamples.js'
const meta = {
  title: 'Components/InlineCode',
  parameters: { layout: 'padded' },
  component: InlineCode,
  args: { children: 'participantId' },
  argTypes: {
    children: { control: 'text' },
    className: { control: 'text' },
    style: { control: 'object' }
  }
} satisfies Meta<InlineCodeProps>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const ReadingInstallationInstructions: Story = {
  render: args => (
    <MotionProvider>
      <InstallRadiant termProps={{ className: args.className, style: args.style }} />
    </MotionProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.selectOptions(canvas.getByRole('combobox', { name: 'Package manager' }), 'yarn')
    await expect(canvas.getByText('yarn add @cognitap/radiant', { exact: true })).toBeVisible()
  }
}
export const NamingAnExportCollection: Story = {
  render: args => (
    <MotionProvider>
      <ConfigureStudyExport termProps={{ className: args.className, style: args.style }} />
    </MotionProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      input = canvas.getByRole('textbox', { name: 'Collection' })
    await userEvent.clear(input)
    await userEvent.type(input, 'practice_sessions')
    await userEvent.click(canvas.getByRole('button', { name: 'Generate export configuration' }))
    await expect(canvas.getByText('practice_sessions', { exact: true })).toBeVisible()
  }
}
export const InspectingExportFields: Story = {
  render: args => (
    <MotionProvider>
      <InspectSessionExport termProps={{ className: args.className, style: args.style }} />
    </MotionProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Completed sessions only' }))
    await expect(canvas.getByText('note', { exact: true })).toBeVisible()
    await expect(canvas.getByRole('caption')).toHaveTextContent('2 session records')
  }
}

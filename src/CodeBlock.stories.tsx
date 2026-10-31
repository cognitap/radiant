import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { MotionProvider } from './motion/react.js'
import {
  CodeBlockPreview,
  InstallRadiant,
  ConfigureStudyExport,
  InspectSessionExport,
  type CodeBlockTaskOptions
} from '../.storybook/examples/CodeBlockExamples.js'

const meta = {
  title: 'Components/CodeBlock',
  parameters: { layout: 'padded' },
  component: CodeBlockPreview,
  args: {
    code: "const message = 'Hello, Radiant.'\nconsole.log(message)\n",
    language: 'typescript',
    controlSize: 'medium',
    lineNumbers: false,
    disabled: false,
    highlight: true,
    dir: 'ltr',
    loadingText: 'Copying code…',
    copiedText: 'Code copied.',
    errorText: 'Could not copy code. Select the code and copy it manually.'
  },
  argTypes: {
    code: { control: 'text' },
    language: { control: 'text' },
    controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] },
    lineNumbers: { control: 'boolean' },
    disabled: { name: 'Disable copying', control: 'boolean' },
    highlight: { control: 'boolean' },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] },
    loadingText: { control: 'text' },
    copiedText: { control: 'text' },
    errorText: { control: 'text' },
    className: { control: 'text' },
    style: { control: 'object' },
    parts: { control: 'object' }
  },
  render: args => (
    <MotionProvider>
      <CodeBlockPreview {...args} />
    </MotionProvider>
  )
} satisfies Meta<CodeBlockTaskOptions & { code?: string; language?: string }>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const InstallingRadiant: Story = {
  render: args => (
    <MotionProvider>
      <InstallRadiant {...args} />
    </MotionProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.selectOptions(canvas.getByRole('combobox', { name: 'Package manager' }), 'npm')
    await expect(canvas.getByText('npm install @cognitap/radiant', { exact: true })).toBeVisible()
  }
}
export const ConfiguringStudyExport: Story = {
  render: args => (
    <MotionProvider>
      <ConfigureStudyExport {...args} />
    </MotionProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      input = canvas.getByRole('textbox', { name: 'Collection' })
    await userEvent.clear(input)
    await userEvent.type(input, 'participant_notes')
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Include session timings' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Generate export configuration' }))
    await expect(
      canvasElement.querySelector('[data-slot="code-block-code"]')!.textContent
    ).toContain('"collection": "participant_notes"')
    await expect(
      canvasElement.querySelector('[data-slot="code-block-code"]')!.textContent
    ).not.toContain('durationMs')
  }
}
export const InspectingSessionExport: Story = {
  render: args => (
    <MotionProvider>
      <InspectSessionExport {...args} />
    </MotionProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Completed sessions only' }))
    await expect(canvas.getByRole('caption')).toHaveTextContent('2 session records')
    await expect(
      canvasElement.querySelector('[data-slot="code-block-code"]')!.textContent
    ).not.toContain('Jonas')
    await userEvent.click(canvas.getByRole('group', { name: 'Session export: sessions.csv' }))
  }
}
export const SharedControlSizes: Story = {
  render: args => (
    <MotionProvider>
      <div style={{ display: 'grid', gap: '1rem', minWidth: 0 }}>
        {(['small', 'medium', 'large'] as const).map(controlSize => (
          <CodeBlockPreview
            {...args}
            key={controlSize}
            controlSize={controlSize}
            applicationLabel={controlSize}
          />
        ))}
      </div>
    </MotionProvider>
  )
}

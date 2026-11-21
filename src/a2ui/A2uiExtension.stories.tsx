import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { A2uiSurface } from './A2uiSurface.js'
import {
  comboboxFixtureMessages,
  EXTENSION_SURFACE_ID,
  radioGroupFixtureMessages,
  selectFixtureMessages,
  switchFixtureMessages,
  textareaFixtureMessages
} from './extensionFixtures.js'

const meta = {
  title: 'A2UI/Extension',
  component: A2uiSurface,
  args: { surfaceId: EXTENSION_SURFACE_ID, messages: selectFixtureMessages },
  render: args => (
    <div className="grid max-w-md gap-4">
      <A2uiSurface {...args} />
    </div>
  )
} satisfies Meta<typeof A2uiSurface>

export default meta

type Story = StoryObj<typeof meta>

export const Select: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('combobox', { name: /Country/ })).toHaveTextContent(
      'Hungary'
    )
  }
}

export const Combobox: Story = {
  args: { messages: comboboxFixtureMessages },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByPlaceholderText('Search cities')).toBeVisible()
  }
}

export const RadioGroup: Story = {
  args: { messages: radioGroupFixtureMessages },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('radio', { name: /Team/ })).toBeChecked()
  }
}

export const Switch: Story = {
  args: { messages: switchFixtureMessages },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      await canvas.findByRole('switch', { name: 'Notify me about replies' })
    ).not.toBeChecked()
  }
}

export const Textarea: Story = {
  args: { messages: textareaFixtureMessages },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('textbox', { name: /Bio/ })).toHaveAttribute('rows', '3')
  }
}

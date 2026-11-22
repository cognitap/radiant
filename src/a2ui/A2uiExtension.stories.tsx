import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { A2uiSurface } from './A2uiSurface.js'
import {
  comboboxFixtureMessages,
  EXTENSION_SURFACE_ID,
  radioGroupFixtureMessages,
  selectFixtureMessages,
  sortableListFixtureMessages,
  switchFixtureMessages,
  textareaFixtureMessages
} from './extensionFixtures.js'
import {
  MATRIX_SURFACE_ID,
  matrixFixtureMessages,
  matrixHeatmapFixtureMessages
} from './matrixFixtures.js'
import { STAGE_SURFACE_ID, stageFixtureMessages } from './stageFixtures.js'
import { ANNOTATED_TEXT_SURFACE_ID, annotatedTextFixtureMessages } from './annotatedTextFixtures.js'

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

export const SortableList: Story = {
  args: {
    messages: sortableListFixtureMessages,
    labels: {
      sortableInstructions:
        'Press Space to pick up. Use the arrow keys to move, Space to drop and Escape to cancel.',
      sortablePickUp: 'Picked up {item}, position {position} of {count}.',
      sortableMove: '{item}, position {position} of {count}.',
      sortableDrop: 'Dropped {item} at position {position} of {count}.',
      sortableCancel: 'Cancelled. {item} is back at position {position} of {count}.'
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const list = await canvas.findByRole('list', { name: 'Order of stops' })
    await expect(
      within(list)
        .getAllByRole('listitem')
        .map(item => item.textContent)
    ).toEqual(['Market', 'Museum', 'Park'])
    await expect(canvas.getByRole('button', { name: 'Museum' })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
  }
}

export const Stage: Story = {
  args: { surfaceId: STAGE_SURFACE_ID, messages: stageFixtureMessages },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('heading', { name: 'Route map' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Share route' })).toBeVisible()
  }
}

export const AnnotatedText: Story = {
  args: { surfaceId: ANNOTATED_TEXT_SURFACE_ID, messages: annotatedTextFixtureMessages },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      await canvas.findByRole('group', { name: 'Review of the retry call' })
    ).toBeVisible()
    await expect(canvas.getByRole('listitem', { name: 'attempts' })).toHaveAccessibleDescription(
      'argument. Statement. Call. Unchecked. attempts → retry: passed to'
    )
  }
}

export const Matrix: Story = {
  args: { surfaceId: MATRIX_SURFACE_ID, messages: matrixFixtureMessages },
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    const grid = await canvas.findByRole('grid', { name: 'Seats' })
    await expect(within(grid).getByRole('gridcell', { name: 'B2' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    const seat = within(grid).getByRole('gridcell', { name: 'C1' })
    await userEvent.click(seat)
    await expect(seat).toHaveAttribute('aria-selected', 'true')
  }
}

export const MatrixHeatmap: Story = {
  args: { surfaceId: MATRIX_SURFACE_ID, messages: matrixHeatmapFixtureMessages },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const grid = await canvas.findByRole('grid', { name: 'Busy hours' })
    await expect(within(grid).getByRole('gridcell', { name: 'Peak' })).toBeVisible()
  }
}

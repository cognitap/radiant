import { act } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within, waitFor } from 'storybook/test'
import { Command, CommandTrigger } from './index.js'
import { MotionProvider } from './motion/react.js'
import {
  ControlProjectCommands,
  ManageStudyProjects,
  NavigateWorkspace,
  FindStudyReport,
  CommandSurface,
  projectActions,
  type CommandTaskOptions
} from '../.storybook/examples/CommandExamples.js'
const meta = {
  title: 'Components/Command',
  component: ManageStudyProjects,
  parameters: { layout: 'padded' },
  args: {
    controlSize: 'medium',
    modal: true,
    dir: 'ltr',
    motion: 'inherit',
    initialOpen: false,
    disabled: false,
    closeOnEscape: true,
    closeOnBackdrop: true
  },
  argTypes: {
    controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] },
    motion: { control: 'inline-radio', options: ['inherit', 'off'] },
    className: { control: 'text' },
    style: { control: 'object' }
  },
  render: options => (
    <MotionProvider>
      <ManageStudyProjects {...options} />
    </MotionProvider>
  )
} satisfies Meta<CommandTaskOptions>
export default meta
type Story = StoryObj<typeof meta>
async function interact(action: () => Promise<void>) {
  // React omits act from production Storybook builds.
  if (typeof act !== 'function') return action()
  const previous = Reflect.get(globalThis, 'IS_REACT_ACT_ENVIRONMENT')
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  try {
    await act(action)
  } finally {
    if (previous === undefined) Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT')
    else Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', previous)
  }
}
export const Default: Story = {
  render: options => (
    <Command
      items={projectActions.map(({ shortcut: _shortcut, ...item }) => item)}
      onAction={() => {}}
      controlSize={options.controlSize}
      modal={options.modal}
      defaultOpen={options.initialOpen}
      closeOnEscape={options.closeOnEscape}
      closeOnBackdrop={options.closeOnBackdrop}
    >
      <CommandTrigger
        disabled={options.disabled}
        controlSize={options.controlSize}
      >
        Open commands
      </CommandTrigger>
      <CommandSurface
        {...options}
        title="Workspace commands"
        description="Search for a workspace action."
      />
    </Command>
  )
}
export const ManagingStudyProjects: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await interact(async () => {
      c.getByRole('button', { name: 'Project commands' }).click()
    })
    await userEvent.type(c.getByRole('combobox', { name: 'Search commands' }), 'Create')
    await interact(async () => {
      c.getByRole('option', { name: /^Create study project/ }).click()
    })
    await expect(c.getByText('Study project 2 created.')).toBeVisible()
  }
}
export const NavigatingWorkspace: Story = {
  render: options => (
    <MotionProvider>
      <NavigateWorkspace {...options} />
    </MotionProvider>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await interact(async () => {
      c.getByRole('button', { name: 'Navigate workspace' }).click()
    })
    await userEvent.type(c.getByRole('combobox', { name: 'Search commands' }), 'settings')
    await interact(async () => {
      c.getByRole('option', { name: 'Open workspace settings' }).click()
    })
    await expect(c.getByRole('heading', { name: 'Workspace settings' })).toHaveFocus()
  }
}
export const FindingStudyReport: Story = {
  render: options => (
    <MotionProvider>
      <FindStudyReport {...options} />
    </MotionProvider>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await interact(async () => {
      c.getByRole('button', { name: 'Find study report' }).click()
    })
    await userEvent.type(c.getByRole('combobox', { name: 'Search commands' }), 'reader')
    await waitFor(() =>
      expect(c.getByRole('option', { name: 'Open reader study report' })).toBeVisible()
    )
    await expect(
      c.getByText('No report is open. Search results do not open themselves.')
    ).toBeVisible()
    await interact(async () => {
      c.getByRole('option', { name: 'Open reader study report' }).click()
    })
    await expect(c.getByText('Completed sessions: 24.')).toBeVisible()
  }
}
export const SharedControlSizes: Story = {
  render: options => (
    <MotionProvider>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,16rem),1fr))',
          gap: '1rem',
          width: '100%'
        }}
      >
        {(['small', 'medium', 'large'] as const).map(controlSize => (
          <fieldset
            key={controlSize}
            style={{
              minWidth: 0,
              margin: 0,
              padding: '1rem',
              border: '1px solid var(--rad-color-border)'
            }}
          >
            <legend>{controlSize}</legend>
            <ManageStudyProjects
              {...options}
              initialOpen={false}
              applicationLabel={controlSize + ' project command application'}
              controlSize={controlSize}
            />
          </fieldset>
        ))}
      </div>
    </MotionProvider>
  )
}
export const Controlled: Story = {
  render: options => <ControlProjectCommands {...options} />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await interact(async () => {
      c.getByRole('button', { name: 'Find archive actions' }).click()
    })
    await expect(c.getByRole('combobox', { name: 'Search commands' })).toHaveValue('archive')
    await expect(c.queryByRole('option', { name: /^Create study project/ })).toBeNull()
    await interact(async () => {
      c.getByRole('option', { name: 'Archive current project' }).click()
    })
    await expect(c.getByText('Last action: archive.')).toBeVisible()
  }
}

import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within, waitFor } from 'storybook/test'
import {
  AppShell,
  AppShellHeader,
  AppShellMain,
  AppShellSkipLink,
  Sidebar,
  SidebarTrigger,
  SidebarLabel,
  SidebarContent,
  NavLink,
  useAppShell,
  type AppShellProps
} from '../../index.js'
import { MotionProvider } from '../../motion/react.js'
import {
  ReviewResearchSessions,
  WriteResearchNotes,
  RestoreResearchLayout,
  type AppShellTaskOptions
} from '../../../.storybook/examples/AppShellExamples.js'
type WorkspaceOptions = AppShellTaskOptions &
  Pick<AppShellProps, 'mainId'> & { defaultCollapsed?: boolean; closeLabel?: string }
function OverviewLink() {
  const shell = useAppShell()
  if (!shell) throw new Error('OverviewLink requires AppShell.')
  return (
    <NavLink
      href={`#${shell.mainId}`}
      icon={<span aria-hidden="true">P</span>}
      onClick={() => shell.setOpen(false)}
    >
      <SidebarLabel>Projects</SidebarLabel>
    </NavLink>
  )
}
function Workspace({
  narrow: _narrow,
  sidebarClassName,
  sidebarStyle,
  sidebarParts,
  closeLabel,
  ...options
}: WorkspaceOptions) {
  return (
    <AppShell
      key={String(options.defaultCollapsed)}
      {...options}
    >
      <AppShellSkipLink>Skip to projects</AppShellSkipLink>
      <AppShellHeader>
        <h1 style={{ fontSize: '1rem', margin: 0 }}>Example workspace</h1>
        <SidebarTrigger aria-label="Toggle navigation">
          <span aria-hidden="true">☰</span>
        </SidebarTrigger>
      </AppShellHeader>
      <Sidebar
        label="Workspace navigation"
        closeLabel={closeLabel}
        className={sidebarClassName}
        style={sidebarStyle}
        parts={sidebarParts}
      >
        <OverviewLink />
        <SidebarContent expandedOnly>
          <p>Review your active projects.</p>
        </SidebarContent>
      </Sidebar>
      <AppShellMain>
        <h2>Projects</h2>
        <p>Choose a project from navigation.</p>
      </AppShellMain>
    </AppShell>
  )
}
const meta = {
  title: 'Components/AppShell',
  component: Workspace,
  parameters: { layout: 'fullscreen' },
  args: {
    defaultCollapsed: false,
    narrow: false,
    dir: 'ltr',
    motion: 'inherit',
    mainId: 'workspace-main',
    closeLabel: 'Close navigation'
  },
  argTypes: {
    defaultCollapsed: { control: 'boolean' },
    narrow: { control: 'boolean' },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] },
    motion: { control: 'inline-radio', options: ['inherit', 'off'] },
    mainId: { control: 'text' },
    closeLabel: { control: 'text' },
    className: { control: 'text' },
    style: { control: 'object' },
    sidebarClassName: { control: 'text' },
    sidebarStyle: { control: 'object' },
    sidebarParts: { control: 'object' }
  },
  decorators: [
    Story => (
      <MotionProvider>
        <Story />
      </MotionProvider>
    )
  ],
  render: args => <Workspace {...args} />
} satisfies Meta<WorkspaceOptions>
export default meta
type Story = StoryObj<typeof meta>
const task = ({
  defaultCollapsed: _collapsed,
  mainId: _mainId,
  closeLabel: _closeLabel,
  ...options
}: WorkspaceOptions) => options
const hidden = { control: false, table: { disable: true } } as const
const taskArgTypes = { defaultCollapsed: hidden, mainId: hidden, closeLabel: hidden }
export const Default: Story = {
  argTypes: { narrow: { control: false, table: { disable: true } } },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      toggle = c.getByRole('button', { name: 'Toggle navigation' })
    await expect(c.getByText('Review your active projects.')).toBeVisible()
    await userEvent.click(toggle)
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(c.getByText('Review your active projects.')).not.toBeVisible()
    await expect(c.getByRole('link', { name: 'Projects' })).toBeVisible()
    await userEvent.click(toggle)
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  }
}
async function application(canvas: HTMLElement) {
  const frame = canvas.querySelector('iframe')!
  await waitFor(() => {
    expect(frame.contentDocument?.querySelector('main')).toBeTruthy()
  })
  const doc = frame.contentDocument!
  return { doc, c: within(doc.body), user: userEvent.setup({ document: doc }) }
}
export const Controlled: Story = {
  argTypes: taskArgTypes,
  render: args => <RestoreResearchLayout {...task(args)} />,
  play: async ({ canvasElement }) => {
    const { c, user } = await application(canvasElement),
      toggle = c.getByRole('button', { name: 'Toggle project navigation' })
    await user.click(c.getByRole('checkbox', { name: 'Keep full navigation' }))
    await user.click(toggle)
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(c.getByRole('status', { name: 'Research workspace feedback' })).toHaveTextContent(
      'Keep full navigation is enabled.'
    )
    await user.click(c.getByRole('checkbox', { name: 'Keep full navigation' }))
    await user.click(toggle)
    await user.click(c.getByRole('link', { name: 'Harbor reading' }))
    await user.click(c.getByRole('button', { name: 'Save layout' }))
    await user.click(c.getByRole('button', { name: 'Reset layout' }))
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await user.click(c.getByRole('button', { name: 'Restore saved layout' }))
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(c.getByRole('heading', { name: 'Harbor reading' })).toBeVisible()
  }
}
export const ReviewingResearchSessions: Story = {
  argTypes: taskArgTypes,
  render: args => <ReviewResearchSessions {...task(args)} />,
  play: async ({ canvasElement }) => {
    const { c, user } = await application(canvasElement)
    await user.type(c.getByRole('textbox', { name: 'Project note' }), 'Bring large-print tasks')
    await user.click(c.getByRole('button', { name: 'Toggle project navigation' }))
    await expect(c.getByRole('link', { name: 'Harbor reading' })).toBeVisible()
    await user.click(c.getByRole('link', { name: 'Harbor reading' }))
    await expect(c.getByRole('heading', { name: 'Harbor reading' })).toBeVisible()
    await expect(c.getByRole('cell', { name: '18' })).toBeVisible()
    await waitFor(async () => {
      await expect(c.getByRole('main', { name: 'Research content' })).toHaveFocus()
    })
  }
}
export const WritingResearchNotes: Story = {
  args: { narrow: true, dir: 'rtl' },
  argTypes: taskArgTypes,
  render: args => <WriteResearchNotes {...task(args)} />,
  play: async ({ canvasElement }) => {
    const { c, user } = await application(canvasElement)
    await user.click(c.getByRole('button', { name: 'Toggle project navigation' }))
    await expect(c.getByRole('dialog', { name: 'Project navigation' })).toBeVisible()
    await user.type(c.getByRole('textbox', { name: 'Project note' }), 'Preserve this reminder')
    await user.click(c.getByRole('link', { name: 'Harbor reading' }))
    await waitFor(() => expect(c.queryByRole('dialog')).toBeNull())
    await user.clear(c.getByRole('textbox', { name: 'Interview notes' }))
    await user.type(
      c.getByRole('textbox', { name: 'Interview notes' }),
      'The participant preferred larger text.'
    )
    await user.click(c.getByRole('button', { name: 'Save note' }))
    await expect(c.getByLabelText('Saved note')).toHaveTextContent(
      'The participant preferred larger text.'
    )
    await user.click(c.getByRole('button', { name: 'Toggle project navigation' }))
    await expect(c.getByRole('textbox', { name: 'Project note' })).toHaveValue(
      'Preserve this reminder'
    )
    await user.click(c.getByRole('button', { name: 'Close navigation' }))
  }
}

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
  useAppShell
} from './index.js'
import { MotionProvider } from './motion/react.js'
import {
  ReviewResearchSessions,
  WriteResearchNotes,
  RestoreResearchLayout,
  type AppShellTaskOptions
} from '../.storybook/examples/AppShellExamples.js'
const meta = {
  title: 'Components/AppShell',
  component: ReviewResearchSessions,
  parameters: { layout: 'fullscreen' },
  args: { narrow: false, dir: 'ltr', motion: 'inherit' },
  argTypes: {
    narrow: { control: 'boolean' },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] },
    motion: { control: 'inline-radio', options: ['inherit', 'off'] },
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
  render: args => <ReviewResearchSessions {...args} />
} satisfies Meta<AppShellTaskOptions>
export default meta
type Story = StoryObj<typeof meta>
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
export const Default: Story = {
  argTypes: { narrow: { control: false, table: { disable: true } } },
  render: ({ narrow: _narrow, sidebarClassName, sidebarStyle, sidebarParts, ...options }) => (
    <AppShell {...options}>
      <AppShellSkipLink>Skip to projects</AppShellSkipLink>
      <AppShellHeader>
        <h1 style={{ fontSize: '1rem', margin: 0 }}>Example workspace</h1>
        <SidebarTrigger aria-label="Toggle navigation">
          <span aria-hidden="true">☰</span>
        </SidebarTrigger>
      </AppShellHeader>
      <Sidebar
        label="Workspace navigation"
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
async function application(canvas: HTMLElement) {
  const frame = canvas.querySelector('iframe')!
  await waitFor(() => {
    expect(frame.contentDocument?.querySelector('main')).toBeTruthy()
  })
  const doc = frame.contentDocument!
  return { doc, c: within(doc.body), user: userEvent.setup({ document: doc }) }
}
export const ReviewingResearchSessions: Story = {
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
  render: args => <WriteResearchNotes {...args} />,
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
export const Controlled: Story = {
  render: args => <RestoreResearchLayout {...args} />,
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

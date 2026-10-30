import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { NavLink } from './index.js'
import { MotionProvider } from './motion/react.js'
import {
  BrowseStudyWorkspace,
  BrowseProjectLibrary,
  NavigateTeamSettings,
  NavigationIcon,
  type NavLinkTaskOptions
} from '../.storybook/examples/NavLinkExamples.js'
type Options = NavLinkTaskOptions & { active: boolean }
const meta = {
  title: 'Components/NavLink',
  component: BrowseStudyWorkspace,
  parameters: { layout: 'padded' },
  args: {
    active: false,
    controlSize: 'medium',
    dir: 'ltr',
    icons: true,
    descriptions: true,
    motion: 'inherit'
  },
  argTypes: {
    active: { control: 'boolean' },
    controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] },
    icons: { control: 'boolean' },
    descriptions: { control: 'boolean' },
    motion: { control: 'inline-radio', options: ['inherit', 'off'] },
    className: { control: 'text' },
    style: { control: 'object' },
    parts: { control: 'object' }
  },
  render: ({ active: _active, ...props }) => <BrowseStudyWorkspace {...props} />
} satisfies Meta<Options>
export default meta
type Story = StoryObj<typeof meta>
const routeOwned = { active: { control: false, table: { disable: true } } } as const
export const Default: Story = {
  argTypes: { motion: { control: false, table: { disable: true } } },
  render: ({ active, icons, descriptions, motion: _motion, ...props }) => (
    <nav
      aria-label="Workspace"
      style={{ width: '100%', maxWidth: '20rem' }}
    >
      <NavLink
        {...props}
        href="#overview"
        active={active}
        icon={icons ? <NavigationIcon /> : undefined}
        description={descriptions ? 'Study health and sessions' : undefined}
      >
        Overview
      </NavLink>
    </nav>
  )
}
export const BrowsingStudyWorkspace: Story = {
  argTypes: { ...routeOwned, motion: { control: false, table: { disable: true } } },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(c.getByRole('link', { name: /^Participants/ }))
    await expect(c.getByRole('link', { name: /^Participants/ })).toHaveAttribute(
      'aria-current',
      'page'
    )
    await expect(c.getByRole('heading', { name: 'Study participants' })).toBeVisible()
  }
}
export const BrowsingProjectLibrary: Story = {
  argTypes: routeOwned,
  render: ({ active: _active, ...props }) => (
    <MotionProvider>
      <BrowseProjectLibrary {...props} />
    </MotionProvider>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(c.getByRole('link', { name: /^Component kit/ }))
    await expect(c.getByRole('link', { name: /^Component kit/ })).toHaveAttribute(
      'aria-current',
      'page'
    )
    await expect(c.getByText('8 participants')).toBeVisible()
  }
}
export const NavigatingTeamSettings: Story = {
  argTypes: routeOwned,
  render: ({ active: _active, ...props }) => (
    <MotionProvider>
      <NavigateTeamSettings {...props} />
    </MotionProvider>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(c.getByRole('link', { name: /^Access rules/ }))
    await expect(c.getByRole('link', { name: /^Access rules/ })).toHaveAttribute(
      'aria-current',
      'page'
    )
    await expect(c.getByText('Two administrators can invite new members.')).toBeVisible()
  }
}

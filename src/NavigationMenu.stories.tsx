import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within, waitFor } from 'storybook/test'
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuContent,
  NavigationMenuViewport
} from './index.js'
import { MotionProvider } from './motion/react.js'
import {
  NavigateResearchLibrary,
  FindHelpResources,
  SwitchResearchWorkspace,
  type NavigationMenuTaskOptions
} from '../.storybook/examples/NavigationMenuExamples.js'
const meta = {
  title: 'Components/NavigationMenu',
  component: NavigateResearchLibrary,
  args: {
    controlSize: 'medium',
    disabled: false,
    dir: 'ltr',
    openDelay: 200,
    closeDelay: 150
  },
  argTypes: {
    controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] },
    motion: { control: 'inline-radio', options: ['inherit', 'off'] },
    sideOffset: { control: 'number' },
    className: { control: 'text' },
    style: { control: 'object' }
  },
  decorators: [
    Story => (
      <MotionProvider>
        <Story />
      </MotionProvider>
    )
  ],
  render: args => <NavigateResearchLibrary {...args} />
} satisfies Meta<NavigationMenuTaskOptions>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: ({ motion, sideOffset, ...args }) => (
    <div style={{ width: 'min(30rem,calc(100vw - 2rem))', minHeight: '15rem' }}>
      <NavigationMenu
        {...args}
        aria-label="Example site"
        items={[{ value: 'learn' }, { value: 'about' }]}
      >
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger value="learn">Learn</NavigationMenuTrigger>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger value="about">About</NavigationMenuTrigger>
          </NavigationMenuItem>
        </NavigationMenuList>
        <NavigationMenuViewport
          motion={motion}
          sideOffset={sideOffset}
        >
          <NavigationMenuContent value="learn">
            <NavigationMenuLink href="#learn-destination">Getting started</NavigationMenuLink>
          </NavigationMenuContent>
          <NavigationMenuContent value="about">
            <NavigationMenuLink href="#about-destination">About the project</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuViewport>
      </NavigationMenu>
      <p id="learn-destination">Read the getting-started guide.</p>
      <p id="about-destination">Meet the project.</p>
    </div>
  )
}
export const FindingStudyMaterials: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(c.getByRole('button', { name: 'Studies' }))
    await userEvent.click(c.getByRole('link', { name: 'Navigation study' }))
    await expect(c.getByRole('heading', { name: 'Navigation study' })).toBeVisible()
    await expect(c.getByRole('button', { name: 'Studies' })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
    await waitFor(async () => {
      await expect(c.getByRole('region', { name: 'Research library destination' })).toHaveFocus()
    })
  }
}
export const FindingHelpResources: Story = {
  render: args => <FindHelpResources {...args} />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.selectOptions(c.getByRole('combobox', { name: 'Guide audience' }), 'new')
    await userEvent.click(c.getByRole('button', { name: 'Guides' }))
    await expect(c.queryByRole('link', { name: 'Compare research rounds' })).toBeNull()
    await userEvent.click(c.getByRole('link', { name: 'Share session results' }))
    await expect(c.getByRole('heading', { name: 'Share session results' })).toBeVisible()
  }
}
export const SharedControlSizes: Story = {
  render: args => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {(['small', 'medium', 'large'] as const).map(controlSize => (
        <NavigateResearchLibrary
          {...args}
          key={controlSize}
          instanceLabel={`Research library ${controlSize}`}
          controlSize={controlSize}
        />
      ))}
    </div>
  )
}
export const Controlled: Story = {
  render: args => <SwitchResearchWorkspace {...args} />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(c.getByRole('checkbox', { name: 'Keep navigation open' }))
    await userEvent.click(c.getByRole('button', { name: 'Projects' }))
    await userEvent.keyboard('{Escape}')
    await expect(c.getByRole('button', { name: 'Projects' })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
    await expect(c.getByRole('status', { name: 'Research workspace feedback' })).toHaveTextContent(
      'Keep navigation open is enabled.'
    )
    await userEvent.click(c.getByRole('checkbox', { name: 'Keep navigation open' }))
    await userEvent.click(c.getByRole('link', { name: 'Harbor reading' }))
    await expect(c.getByRole('heading', { name: 'Harbor reading' })).toBeVisible()
  }
}
export const WithoutMotion: Story = {
  render: args => (
    <FindHelpResources
      {...args}
      motion="off"
    />
  )
}

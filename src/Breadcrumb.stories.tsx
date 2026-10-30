import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator
} from './index.js'
const meta = {
  title: 'Components/Breadcrumb',
  component: Breadcrumb,
  parameters: {
    docs: {
      description: {
        component:
          'Named native navigation with an ordered hierarchy. Link parts compose the real Link, preserving native navigation and its anchor adapter. Use one current Page span or current Link; separators stay decorative inside list items. Applications own routes and hierarchy. No menu, roving focus or router state is added. Names, typography, colors, spacing and native host refs remain customizable.'
      }
    }
  }
} satisfies Meta<typeof Breadcrumb>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#home">Home</BreadcrumbLink>
          <BreadcrumbSeparator />
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink href="#projects">Projects</BreadcrumbLink>
          <BreadcrumbSeparator />
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbPage>Design system</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
export const CurrentLink: Story = {
  render: () => (
    <Breadcrumb aria-label="Project location">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#projects">Projects</BreadcrumbLink>
          <BreadcrumbSeparator>›</BreadcrumbSeparator>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink
            href="#current"
            current
          >
            Design system
          </BreadcrumbLink>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
export const Customisation: Story = {
  render: () => (
    <Breadcrumb
      style={{
        width: '12rem',
        '--rad-breadcrumb-gap': '.75rem',
        '--rad-breadcrumb-font-size': '1rem'
      }}
    >
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#long">AnUnbrokenProjectCategoryThatWraps</BreadcrumbLink>
          <BreadcrumbSeparator />
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbPage>Long current page title</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

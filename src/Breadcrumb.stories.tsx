import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator
} from './index.js'
import { RoutedTrail } from '../.storybook/examples/BreadcrumbExamples.js'
const meta = {
  title: 'Components/Breadcrumb',
  component: Breadcrumb,
  parameters: {
    docs: {
      description: {
        component:
          'A named navigation landmark with an ordered trail. BreadcrumbLink is a Link that defaults to the subtle variant and neutral tone. Mark one current page with BreadcrumbPage or a current BreadcrumbLink. Separators stay decorative inside list items. Long trails wrap; Radiant does not collapse them.'
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
  parameters: {
    docs: {
      description: {
        story:
          'Use a current BreadcrumbLink when the current page should stay linkable. aria-label replaces the default "Breadcrumb" landmark name.'
      }
    }
  },
  render: () => (
    <Breadcrumb aria-label="Project location">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#projects">Projects</BreadcrumbLink>
          <BreadcrumbSeparator />
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
const trail = ['Workspace', 'Engineering', 'Platform', 'Design system', 'Components', 'Navigation']
export const LongTrail: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Items wrap onto new lines and long words break, so the trail never overflows its container.'
      }
    }
  },
  render: () => (
    <Breadcrumb style={{ maxWidth: '18rem' }}>
      <BreadcrumbList>
        {trail.map(label => (
          <BreadcrumbItem key={label}>
            <BreadcrumbLink href={`#${label.toLowerCase().replaceAll(' ', '-')}`}>
              {label}
            </BreadcrumbLink>
            <BreadcrumbSeparator />
          </BreadcrumbItem>
        ))}
        <BreadcrumbItem>
          <BreadcrumbPage>AnUnbrokenCurrentPageTitleThatWraps</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
export const WithRouter: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'BreadcrumbLink takes render, like Link. Forward the resolved props to your router anchor. Plain clicks route; modified clicks keep native behavior.'
      }
    }
  },
  render: () => <RoutedTrail />
}
export const CustomSeparator: Story = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbList>
        {['Home', 'Projects'].map(label => (
          <BreadcrumbItem key={label}>
            <BreadcrumbLink href={`#${label.toLowerCase()}`}>{label}</BreadcrumbLink>
            <BreadcrumbSeparator>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4.5 2.5 8 6l-3.5 3.5" />
              </svg>
            </BreadcrumbSeparator>
          </BreadcrumbItem>
        ))}
        <BreadcrumbItem>
          <BreadcrumbPage>Design system</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
export const Customisation: Story = {
  render: () => (
    <Breadcrumb
      style={{
        '--rad-breadcrumb-gap': '.75rem',
        '--rad-breadcrumb-font-size': '1rem',
        '--rad-breadcrumb-link-color': 'var(--rad-color-foreground)',
        '--rad-breadcrumb-separator-color': 'var(--rad-color-foreground)'
      }}
    >
      <BreadcrumbList>
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

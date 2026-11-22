import type { Meta, StoryObj } from '@storybook/react-vite'
import { Card, CardHeader, CardTitle, Grid, type GridProps } from '../../index.js'

const meta = {
  title: 'Components/Grid',
  component: Grid,
  args: { maxColumns: 3, gap: 'normal' },
  argTypes: {
    maxColumns: { control: 'inline-radio', options: [1, 2, 3, 4, 5, 6] },
    gap: { control: 'inline-radio', options: ['tight', 'normal', 'airy'] }
  },
  parameters: {
    docs: {
      description: {
        component:
          'A div whose children are equal items. It fits as many columns as its own width holds at the `components.grid.minItemWidth` token (12rem) per item, up to `maxColumns`.'
      }
    }
  }
} satisfies Meta<typeof Grid>

export default meta
type Story = StoryObj<typeof meta>

const courses = ['Algebra', 'Biology', 'Chemistry', 'Drawing', 'Economics', 'French']

function Courses({ width, ...props }: GridProps & { width: string }) {
  return (
    <div style={{ width, maxWidth: '100%' }}>
      <Grid {...props}>
        {courses.map(course => (
          <Card key={course}>
            <CardHeader>
              <CardTitle>{course}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </Grid>
    </div>
  )
}

export const Default: Story = {
  render: args => (
    <Courses
      {...args}
      width="720px"
    />
  )
}

export const Widths: Story = {
  parameters: {
    docs: {
      description: {
        story: 'The same Grid at 360px and 720px: one column, then three.'
      }
    }
  },
  render: args => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <Courses
        {...args}
        width="360px"
      />
      <Courses
        {...args}
        width="720px"
      />
    </div>
  )
}

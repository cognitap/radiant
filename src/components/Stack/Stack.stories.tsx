import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Stack
} from '../../index.js'
const meta = {
  title: 'Components/Stack',
  component: Stack,
  args: { orientation: 'vertical', gap: 'normal', align: 'stretch', justify: 'start', wrap: false },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
    gap: { control: 'inline-radio', options: ['tight', 'normal', 'airy'] },
    align: { control: 'inline-radio', options: ['start', 'center', 'end', 'stretch'] },
    justify: {
      control: 'select',
      options: ['start', 'center', 'end', 'between', 'around', 'evenly', 'stretch']
    },
    style: { control: 'object' }
  },
  parameters: {
    docs: {
      description: {
        component:
          'A flex div that lays children out in one direction. The gap comes from the theme spacing scale, so themes change it everywhere at once. The root adds no semantics; native props, refs, classes and styles reach the div.'
      }
    }
  }
} satisfies Meta<typeof Stack>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: args => (
    <Stack
      {...args}
      style={{ maxWidth: '24rem', ...args.style }}
    >
      <Button variant="outline">Draft</Button>
      <Button variant="outline">Review</Button>
      <Button>Publish</Button>
    </Stack>
  )
}
export const SpacingSteps: Story = {
  render: () => (
    <Stack gap="airy">
      {(['tight', 'normal', 'airy'] as const).map(gap => (
        <Stack
          key={gap}
          orientation="horizontal"
          gap={gap}
          align="center"
          wrap
        >
          <Badge>{gap}</Badge>
          <Badge tone="neutral">Reading</Badge>
          <Badge tone="neutral">Writing</Badge>
          <Badge tone="neutral">Listening</Badge>
        </Stack>
      ))}
    </Stack>
  )
}
export const CardFooterRow: Story = {
  render: () => (
    <Card style={{ maxWidth: '28rem' }}>
      <CardHeader>
        <CardTitle>Weekly review</CardTitle>
        <CardDescription>Five cards are due today.</CardDescription>
      </CardHeader>
      <CardContent>
        <Stack
          orientation="horizontal"
          justify="between"
          align="center"
          wrap
        >
          <Button variant="ghost">Skip</Button>
          <Stack
            orientation="horizontal"
            gap="tight"
          >
            <Button variant="outline">Later</Button>
            <Button>Start</Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

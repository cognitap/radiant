import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Split,
  SplitMain,
  SplitSecondary,
  type SplitProps
} from '../../index.js'

const meta = {
  title: 'Components/Split',
  component: Split,
  args: { side: 'end', ratio: 'main', gap: 'normal' },
  argTypes: {
    side: { control: 'inline-radio', options: ['start', 'end'] },
    ratio: { control: 'inline-radio', options: ['balanced', 'main'] },
    gap: { control: 'inline-radio', options: ['tight', 'normal', 'airy'] }
  },
  parameters: {
    docs: {
      description: {
        component:
          'A div with SplitMain and SplitSecondary parts. Split is an inline-size container: below 40rem the parts stack in source order; wider, they share a row, the secondary part on `side`, sized by `ratio`. Write the parts in reading order.'
      }
    }
  }
} satisfies Meta<typeof Split>

export default meta
type Story = StoryObj<typeof meta>

function Trip({ width, ...props }: SplitProps & { width: string }) {
  return (
    <div style={{ width, maxWidth: '100%' }}>
      <Split {...props}>
        <SplitMain>
          <Card>
            <CardHeader>
              <CardTitle>Itinerary</CardTitle>
            </CardHeader>
            <CardContent>Day one: ride from the station to the lake.</CardContent>
          </Card>
        </SplitMain>
        <SplitSecondary>
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>Three days, 140 km.</CardContent>
          </Card>
        </SplitSecondary>
      </Split>
    </div>
  )
}

export const Default: Story = {
  render: args => (
    <Trip
      {...args}
      width="720px"
    />
  )
}

export const Widths: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The same Split at 360px and 720px. Layout follows the Split width, not the viewport.'
      }
    }
  },
  render: args => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <Trip
        {...args}
        width="360px"
      />
      <Trip
        {...args}
        width="720px"
      />
    </div>
  )
}

export const SecondaryAtStart: Story = {
  args: { side: 'start', ratio: 'balanced' },
  render: Default.render
}

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
  args: { ratio: 'main', gap: 'normal' },
  argTypes: {
    ratio: { control: 'inline-radio', options: ['balanced', 'main'] },
    gap: { control: 'inline-radio', options: ['tight', 'normal', 'airy'] }
  },
  parameters: {
    docs: {
      description: {
        component:
          'A div with SplitMain and SplitSecondary parts. Split is an inline-size container: below 40rem the parts stack; wider, they share a row sized by `ratio`. Both layouts keep source order, so put SplitSecondary first to show it at the start.'
      }
    }
  }
} satisfies Meta<typeof Split>

export default meta
type Story = StoryObj<typeof meta>

const main = (
  <SplitMain>
    <Card>
      <CardHeader>
        <CardTitle>Itinerary</CardTitle>
      </CardHeader>
      <CardContent>Day one: ride from the station to the lake.</CardContent>
    </Card>
  </SplitMain>
)
const secondary = (
  <SplitSecondary>
    <Card>
      <CardHeader>
        <CardTitle>Summary</CardTitle>
      </CardHeader>
      <CardContent>Three days, 140 km.</CardContent>
    </Card>
  </SplitSecondary>
)

function Trip({
  width,
  secondaryFirst = false,
  ...props
}: SplitProps & { width: string; secondaryFirst?: boolean }) {
  return (
    <div style={{ width, maxWidth: '100%' }}>
      <Split {...props}>
        {secondaryFirst ? null : main}
        {secondary}
        {secondaryFirst ? main : null}
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
  args: { ratio: 'balanced' },
  render: args => (
    <Trip
      {...args}
      width="720px"
      secondaryFirst
    />
  )
}

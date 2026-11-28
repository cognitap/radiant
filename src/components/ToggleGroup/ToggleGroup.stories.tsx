import type { Meta, StoryObj } from '@storybook/react-vite'
import { ToggleGroup, ToggleGroupItem } from '../../index.js'
import { MotionProvider } from '../../motion/react.js'

const meta = {
  title: 'Components/ToggleGroup',
  component: ToggleGroup,
  args: {
    'aria-label': 'Text alignment',
    variant: 'buttons',
    orientation: 'horizontal',
    dir: 'ltr',
    disabled: false
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['buttons', 'segmented'] },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] }
  },
  parameters: { controls: { include: ['variant', 'orientation', 'dir', 'disabled'] } }
} satisfies Meta<typeof ToggleGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: ({ variant, orientation, dir, disabled }) => (
    <MotionProvider>
      <ToggleGroup
        aria-label="Text alignment"
        defaultValue="left"
        variant={variant}
        orientation={orientation}
        dir={dir}
        disabled={disabled}
      >
        <ToggleGroupItem value="left">Left</ToggleGroupItem>
        <ToggleGroupItem value="center">Center</ToggleGroupItem>
        <ToggleGroupItem value="right">Right</ToggleGroupItem>
      </ToggleGroup>
    </MotionProvider>
  )
}

export const Multiple: Story = {
  args: { 'aria-label': 'Text formatting' },
  parameters: { controls: { include: ['orientation', 'dir', 'disabled'] } },
  render: ({ orientation, dir, disabled }) => (
    <MotionProvider>
      <ToggleGroup
        aria-label="Text formatting"
        type="multiple"
        defaultValue={['bold']}
        orientation={orientation}
        dir={dir}
        disabled={disabled}
      >
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
        <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
      </ToggleGroup>
    </MotionProvider>
  )
}

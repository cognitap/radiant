import type { Meta, StoryObj } from '@storybook/react-vite'
import { Field, Slider } from './index.js'
import {
  SliderControlledExample,
  SliderSettingsExample,
  SliderSizeComparison,
  SliderStepsExample
} from '../.storybook/examples/SliderExamples.js'

const meta = {
  title: 'Components/Slider',
  component: Slider,
  args: { 'aria-label': 'Volume', defaultValue: 40, min: 0, max: 100, step: 5 },
  argTypes: {
    controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] }
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Single-thumb numeric adjustment using a native range input. Field supplies its label, ID, help, error and inherited disabled state. Choose defaultValue or numeric value/onChange; read event.target.valueAsNumber. Keyboard, pointer input, bounds, step and form payloads stay native. Native reset restores uncontrolled defaults; controlled values reset in the form owner. Vertical sliders increase bottom to top. aria-valuetext supplies application-owned formatting. Root className/style/ref reach the input; components.slider styles the track and thumb independently. Range always has a value, so required and readOnly do not apply.'
      }
    }
  }
} satisfies Meta<typeof Slider>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithField: Story = {
  args: { 'aria-label': undefined },
  render: args => (
    <Field
      label="Notification volume"
      description="Choose a comfortable level."
      error="Lower the volume to continue."
    >
      <Slider
        {...args}
        name="volume"
      />
    </Field>
  )
}
export const Controlled: Story = {
  parameters: { controls: { disable: true } },
  render: () => <SliderControlledExample />
}
export const Steps: Story = {
  parameters: { controls: { disable: true } },
  render: () => <SliderStepsExample />
}
export const States: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '32rem' }}>
      <Field label="Volume">
        <Slider defaultValue={50} />
      </Field>
      <Field
        label="Unavailable volume"
        disabled
      >
        <Slider defaultValue={30} />
      </Field>
      <Field
        label="Output level"
        error="Lower the level to avoid clipping."
      >
        <Slider defaultValue={90} />
      </Field>
    </div>
  )
}
export const Vertical: Story = {
  render: () => (
    <Field
      label="Microphone gain"
      description="Higher values are at the top."
    >
      <Slider
        name="gain"
        defaultValue={40}
        orientation="vertical"
      />
    </Field>
  )
}
export const RightToLeft: Story = {
  render: () => (
    <div
      dir="rtl"
      style={{ maxWidth: '32rem' }}
    >
      <Field label="مستوى الصوت">
        <Slider
          name="volume"
          defaultValue={40}
        />
      </Field>
    </div>
  )
}
export const Customisation: Story = {
  args: {
    style: {
      '--rad-slider-track-size': '.5rem',
      '--rad-slider-track-radius': '999px',
      '--rad-slider-thumb-size': '1.75rem',
      '--rad-slider-thumb-radius': '999px',
      '--rad-slider-thumb-border-width': '2px',
      '--rad-slider-thumb-shadow': '0 2px 4px #0003'
    }
  }
}
export const ListeningPreferences: Story = {
  parameters: { controls: { disable: true } },
  render: () => <SliderSettingsExample />
}
export const SharedControlSizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => <SliderSizeComparison />
}

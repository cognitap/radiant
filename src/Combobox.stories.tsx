import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Combobox,
  ComboboxInput,
  ComboboxPortal,
  ComboboxContent,
  Field,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle
} from './index.js'
import {
  ComboboxTravelExample,
  ComboboxAsyncExample,
  cityOptions
} from '../.storybook/examples/ComboboxExamples.js'

const meta = {
  title: 'Components/Combobox',
  component: Combobox,
  args: { items: cityOptions },
  parameters: { layout: 'centered' }
} satisfies Meta<typeof Combobox>
export default meta
type Story = StoryObj<typeof meta>
export const TeamGathering: Story = { render: () => <ComboboxTravelExample /> }
export const AsyncResults: Story = { render: () => <ComboboxAsyncExample /> }
export const Default: Story = {
  render: () => (
    <Field
      label="City"
      className="w-80 max-w-full"
    >
      <Combobox items={cityOptions} />
    </Field>
  )
}
export const Open: Story = {
  render: () => (
    <Field
      label="City"
      className="w-80 max-w-full"
    >
      <Combobox
        items={cityOptions}
        defaultOpen
        defaultValue="budapest"
      />
    </Field>
  )
}
export const Loading: Story = {
  render: () => (
    <Field
      label="City"
      className="w-80 max-w-full"
    >
      <Combobox
        items={[]}
        loading
        defaultOpen
      />
    </Field>
  )
}
export const Empty: Story = {
  render: () => (
    <Field
      label="City"
      className="w-80 max-w-full"
    >
      <Combobox
        items={[]}
        defaultOpen
      />
    </Field>
  )
}
export const Error: Story = {
  render: () => (
    <Field
      label="City"
      className="w-80 max-w-full"
    >
      <Combobox
        items={[]}
        error="Cities could not be loaded. Please try again."
        defaultOpen
      />
    </Field>
  )
}
export const Disabled: Story = {
  render: () => (
    <Field
      label="City"
      disabled
      description="An administrator manages this destination."
    >
      <Combobox
        items={cityOptions}
        defaultValue="budapest"
      />
    </Field>
  )
}
export const Invalid: Story = {
  render: () => (
    <Field
      label="City"
      error="Choose a destination."
    >
      <Combobox items={cityOptions} />
    </Field>
  )
}
export const Customized: Story = {
  render: () => (
    <Field
      label="City"
      className="w-80 max-w-full"
    >
      <Combobox items={cityOptions}>
        <ComboboxInput
          className="rounded-none border-2"
          placeholder="Find your next city"
        />
        <ComboboxPortal>
          <ComboboxContent
            className="rounded-none border-2"
            motion="off"
          />
        </ComboboxPortal>
      </Combobox>
    </Field>
  )
}
export const InDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger>Choose a destination</DialogTrigger>
      <DialogContent>
        <DialogTitle>Your next gathering</DialogTitle>
        <Field label="City">
          <Combobox items={cityOptions} />
        </Field>
      </DialogContent>
    </Dialog>
  )
}
export const SharedControlSizes: Story = {
  render: () => (
    <div className="grid w-80 max-w-full gap-5">
      {(['small', 'medium', 'large'] as const).map(size => (
        <Field
          label={`${size} city`}
          key={size}
        >
          <Combobox
            items={cityOptions}
            controlSize={size}
          />
        </Field>
      ))}
    </div>
  )
}

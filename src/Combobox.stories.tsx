import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Button,
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
  ComboboxControlledExample,
  ComboboxMultipleExample,
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
export const Default: Story = { render: () => <ComboboxTravelExample /> }
export const WithField: Story = {
  render: () => (
    <form className="grid w-80 max-w-full gap-3">
      <Field
        label="City"
        required
        description="Search for a city, then choose a result."
      >
        <Combobox
          items={cityOptions}
          name="city"
        />
      </Field>
      <Button type="submit">Submit</Button>
    </form>
  )
}
export const Controlled: Story = { render: () => <ComboboxControlledExample /> }
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
export const ChoosingSeveralCities: Story = { render: () => <ComboboxMultipleExample /> }
export const AsyncResults: Story = { render: () => <ComboboxAsyncExample /> }
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
export const States: Story = {
  render: () => (
    <div className="grid w-80 max-w-full gap-5">
      <Field
        label="Disabled city"
        disabled
        description="An administrator manages this destination."
      >
        <Combobox
          items={cityOptions}
          defaultValue="budapest"
        />
      </Field>
      <Field
        label="Invalid city"
        error="Choose a destination."
      >
        <Combobox items={cityOptions} />
      </Field>
      <Field
        label="Read-only city"
        description="Focusable and submitted with the form, but not editable."
      >
        <Combobox
          items={cityOptions}
          defaultValue="oslo"
          readOnly
        />
      </Field>
    </div>
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
export const Customisation: Story = {
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

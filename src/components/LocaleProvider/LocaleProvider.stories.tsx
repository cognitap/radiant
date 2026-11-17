import type { Meta, StoryObj } from '@storybook/react-vite'
import { LocaleProvider } from './LocaleProvider.js'
import { NumberField } from '../NumberField/NumberField.js'
import { Field } from '../Field/Field.js'

const meta = {
  component: LocaleProvider,
  args: { locale: 'en-GB' },
  render: args => (
    <LocaleProvider {...args}>
      <Field label="Amount">
        <NumberField defaultValue={1234.5} />
      </Field>
    </LocaleProvider>
  )
} satisfies Meta<typeof LocaleProvider>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const NestedScopes: Story = {
  render: () => (
    <LocaleProvider locale="ar-EG">
      <Field label="المبلغ">
        <NumberField
          defaultValue={1234.5}
          incrementLabel="زيادة القيمة"
          decrementLabel="تقليل القيمة"
        />
      </Field>
      <LocaleProvider locale="fr-FR">
        <Field label="Montant">
          <NumberField
            defaultValue={1234.5}
            incrementLabel="Augmenter"
            decrementLabel="Diminuer"
          />
        </Field>
      </LocaleProvider>
    </LocaleProvider>
  )
}

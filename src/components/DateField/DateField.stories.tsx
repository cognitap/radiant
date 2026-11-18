import type { Meta, StoryObj } from '@storybook/react-vite'
import { Field } from '../Field/Field.js'
import { LocaleProvider } from '../LocaleProvider/LocaleProvider.js'
import { DateField } from './DateField.js'

const meta = {
  title: 'Components/DateField',
  component: DateField,
  args: { 'aria-label': 'Invoice date' }
} satisfies Meta<typeof DateField>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const LocalizedInvoiceDate: Story = {
  render: () => (
    <LocaleProvider locale="fr-FR">
      <Field
        label="Date de facturation"
        description="Saisissez le jour, le mois et l’année."
      >
        <DateField
          name="invoiceDate"
          defaultValue="2028-02-29"
        />
      </Field>
    </LocaleProvider>
  )
}

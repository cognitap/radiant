import type { Meta, StoryObj } from '@storybook/react-vite'
import { LocaleProvider } from './LocaleProvider.js'
import { getLocaleAttributes } from '../../internal/locale.js'
import { NumberField } from '../NumberField/NumberField.js'
import { NumberFormatter } from '../NumberFormatter/NumberFormatter.js'
import { Field } from '../Field/Field.js'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../Tabs/Tabs.js'

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

export const CompareRegionalAmounts: Story = {
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
        <LocaleProvider>
          <Field label="Montant">
            <NumberField
              defaultValue={1234.5}
              incrementLabel="Augmenter"
              decrementLabel="Diminuer"
            />
          </Field>
        </LocaleProvider>
      </LocaleProvider>
    </LocaleProvider>
  )
}

export const PublishAPriceList: Story = {
  render: () => {
    const locale = 'de-DE'
    const options = { style: 'currency', currency: 'EUR' } as const
    return (
      <ul {...getLocaleAttributes(locale)}>
        <LocaleProvider
          locale={locale}
          scope="document"
        >
          <li>
            Monatsabo:{' '}
            <NumberFormatter
              value={14.9}
              options={options}
            />
          </li>
          <li>
            Jahresabo:{' '}
            <NumberFormatter
              value={149}
              options={options}
            />
          </li>
        </LocaleProvider>
      </ul>
    )
  }
}

export const ReadABilingualReport: Story = {
  render: () => (
    <LocaleProvider locale="he-IL">
      <Tabs defaultValue="overview">
        <TabsList aria-label="דוח מחקר">
          <TabsTrigger value="overview">סקירה</TabsTrigger>
          <TabsTrigger value="notes">הערות</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <LocaleProvider locale="fr-FR">
            <Tabs defaultValue="summary">
              <TabsList aria-label="Rapport de recherche">
                <TabsTrigger value="summary">Résumé</TabsTrigger>
                <TabsTrigger value="history">Historique</TabsTrigger>
              </TabsList>
              <TabsContent value="summary">Les entretiens sont terminés.</TabsContent>
              <TabsContent value="history">Le rapport a été mis à jour.</TabsContent>
            </Tabs>
          </LocaleProvider>
        </TabsContent>
        <TabsContent value="notes">הצוות סיים את הראיונות.</TabsContent>
      </Tabs>
    </LocaleProvider>
  )
}

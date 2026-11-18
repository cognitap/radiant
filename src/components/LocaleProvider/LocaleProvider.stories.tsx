import type { Meta, StoryObj } from '@storybook/react-vite'
import { LocaleProvider } from './LocaleProvider.js'
import { NumberField } from '../NumberField/NumberField.js'
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

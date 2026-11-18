import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../Button/Button.js'
import { LocaleProvider } from '../LocaleProvider/LocaleProvider.js'
import { NumberFormatter } from './NumberFormatter.js'

const meta = {
  title: 'Components/NumberFormatter',
  component: NumberFormatter,
  args: { value: 12_345.67 }
} satisfies Meta<typeof NumberFormatter>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

function InvoiceTotal() {
  const [locale, setLocale] = useState('en-US')
  return (
    <div className="grid justify-items-start gap-3">
      <LocaleProvider locale={locale}>
        <p>
          Invoice total{' '}
          <NumberFormatter
            value={1299.95}
            options={{ style: 'currency', currency: 'EUR' }}
          />
        </p>
      </LocaleProvider>
      <Button
        variant="outline"
        onClick={() => setLocale(locale === 'en-US' ? 'de-DE' : 'en-US')}
      >
        {locale === 'en-US' ? 'Use German formatting' : 'Use US formatting'}
      </Button>
    </div>
  )
}

export const ReadAnInvoice: Story = { render: () => <InvoiceTotal /> }
export const ReviewDeliveryPerformance: Story = {
  render: () => (
    <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2">
      <dt>On-time deliveries</dt>
      <dd>
        <NumberFormatter
          value={0.963}
          options={{ style: 'percent', maximumFractionDigits: 1 }}
        />
      </dd>
      <dt>Average delivery time</dt>
      <dd>
        <NumberFormatter
          value={3.5}
          options={{ style: 'unit', unit: 'hour', unitDisplay: 'short' }}
        />
      </dd>
    </dl>
  )
}

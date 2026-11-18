import { NumberFormatter, type NumberFormatterProps } from '@cognitap/radiant'

const invoice: NumberFormatterProps = {
  value: 1234n,
  locale: 'de-DE',
  options: { style: 'currency', currency: 'EUR' }
}

export const formattedInvoice = <NumberFormatter {...invoice} />

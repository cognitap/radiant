export const defaultLocale = 'en-US'

// Right-to-left scripts from Unicode CLDR script metadata, including script variants.
const rtlScripts = new Set([
  'Adlm',
  'Arab',
  'Aran',
  'Armi',
  'Avst',
  'Chrs',
  'Elym',
  'Gara',
  'Hatr',
  'Hebr',
  'Hung',
  'Khar',
  'Lydi',
  'Mand',
  'Mani',
  'Mend',
  'Merc',
  'Mero',
  'Narb',
  'Nbat',
  'Nkoo',
  'Orkh',
  'Ougr',
  'Palm',
  'Phli',
  'Phlp',
  'Phnx',
  'Prti',
  'Rohg',
  'Samr',
  'Sarb',
  'Sidt',
  'Sogd',
  'Sogo',
  'Syrc',
  'Syre',
  'Syrj',
  'Syrn',
  'Thaa',
  'Yezi'
])

export function getLocaleAttributes(locale?: string): { lang?: string; dir?: 'ltr' | 'rtl' } {
  if (locale === undefined) return {}
  const tag = new Intl.Locale(locale)
  const script = tag.script ?? tag.maximize().script
  return { lang: tag.baseName, dir: script && rtlScripts.has(script) ? 'rtl' : 'ltr' }
}

type LocaleSupport = Pick<typeof Intl.NumberFormat, 'supportedLocalesOf'>

export function supportedLocale(service: LocaleSupport, locale: string): string {
  return service.supportedLocalesOf(locale, { localeMatcher: 'lookup' }).length
    ? locale
    : defaultLocale
}

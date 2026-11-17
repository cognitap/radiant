import { getLocaleAttributes, LocaleProvider, type LocaleProviderProps } from '@cognitap/radiant'

const documentScope: LocaleProviderProps = { locale: 'he-IL', scope: 'document' }
export const layout = (
  <section {...getLocaleAttributes(documentScope.locale)}>
    <LocaleProvider {...documentScope}>
      <LocaleProvider locale="fr-FR">Content</LocaleProvider>
    </LocaleProvider>
  </section>
)
// @ts-expect-error Direction is computed from the locale.
export const direction: LocaleProviderProps = { dir: 'ltr' }

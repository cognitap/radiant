'use client'

import type { ReactNode } from 'react'
import { getLocaleAttributes } from '../../internal/locale.js'
import { LocaleContext, useLocale } from '../../react/useLocale.js'

export type LocaleProviderProps = {
  locale?: string
  scope?: 'subtree' | 'document'
  children?: ReactNode
}

/** Use document scope when the root layout renders lang and dir on html. */
export function LocaleProvider({
  locale,
  scope = 'subtree',
  children
}: LocaleProviderProps): ReactNode {
  const current = useLocale(locale)
  const attributes = getLocaleAttributes(locale)
  return (
    <LocaleContext.Provider value={current}>
      {scope === 'document' ? children : <div {...attributes}>{children}</div>}
    </LocaleContext.Provider>
  )
}

'use client'

import { createContext, useContext, useMemo } from 'react'
import { defaultLocale } from '../internal/locale.js'
import { createLocaleMatcher } from '../internal/localeMatcher.js'

export const LocaleContext = createContext(defaultLocale)

export function useLocale(override?: string): string {
  const inherited = useContext(LocaleContext)
  return override ?? inherited
}

export function useLocaleMatcher() {
  const locale = useLocale()
  return useMemo(() => createLocaleMatcher(locale), [locale])
}

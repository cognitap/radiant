'use client'

import { useMemo, type ComponentProps } from 'react'
import { joinIds } from '../../internal/ids.js'
import { supportedLocale } from '../../internal/locale.js'
import type { PartStyle } from '../../presentation.js'
import { useLocale } from '../../react/useLocale.js'

export type NumberFormatterProps = Omit<
  ComponentProps<'bdi'>,
  'children' | 'dangerouslySetInnerHTML' | 'style'
> & {
  value: number | bigint
  /** Overrides the nearest LocaleProvider for this value. */
  locale?: string
  options?: Intl.NumberFormatOptions
  style?: PartStyle['style']
  'data-slot'?: string
}

/** Inline formatted text with native bidi isolation. */
export function NumberFormatter({ value, locale, options, lang, ...props }: NumberFormatterProps) {
  const requested = useLocale(locale)
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(supportedLocale(Intl.NumberFormat, requested), {
        localeMatcher: 'lookup',
        ...options
      }),
    [requested, options]
  )
  return (
    <bdi
      {...props}
      // Locale data can differ between engines. Preserve the server text through hydration.
      suppressHydrationWarning
      lang={lang ?? formatter.resolvedOptions().locale}
      data-slot={joinIds('number-formatter', props['data-slot'])}
    >
      {formatter.format(value)}
    </bdi>
  )
}

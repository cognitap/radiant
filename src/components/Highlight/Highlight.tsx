'use client'

import { useMemo, type ComponentProps, type ReactNode } from 'react'
import { cn } from 'cn'
import { joinIds } from '../../internal/ids.js'
import { supportedLocale } from '../../internal/locale.js'
import type { PartStyle } from '../../presentation.js'
import { useLocale } from '../../react/useLocale.js'

export type HighlightProps = Omit<ComponentProps<'span'>, 'children' | 'style'> & {
  text: string
  query: string
  caseSensitive?: boolean
  ignoreDiacritics?: boolean
  parts?: { mark?: PartStyle }
  style?: PartStyle['style']
  'data-slot'?: string
}

function findRanges(
  text: string,
  query: string,
  segmenter: Intl.Segmenter,
  caseSensitive: boolean,
  ignoreDiacritics: boolean
) {
  const ranges: { start: number; end: number }[] = []
  if (!query || !text) return ranges
  const locale = segmenter.resolvedOptions().locale
  function fold(segment: string) {
    const composed = segment.normalize()
    const cased = caseSensitive
      ? composed
      : composed.toLocaleLowerCase(locale).toLocaleUpperCase(locale)
    const decomposed = cased.normalize('NFD')
    return ignoreDiacritics ? decomposed.replace(/\p{Diacritic}/gu, '') : decomposed
  }
  const needle = Array.from(segmenter.segment(query), value => fold(value.segment)).join('')
  if (!needle) return ranges

  let folded = ''
  const starts = new Map<number, number>()
  const ends = new Map<number, number>()
  for (const { index, segment } of segmenter.segment(text)) {
    const key = fold(segment)
    if (!key) continue
    // Folding can change a grapheme's length. Both boundaries must map to the original text.
    starts.set(folded.length, index)
    folded += key
    ends.set(folded.length, index + segment.length)
  }
  let cursor = 0
  while (cursor < folded.length) {
    const index = folded.indexOf(needle, cursor)
    if (index < 0) break
    const limit = index + needle.length
    const start = starts.get(index)
    const end = ends.get(limit)
    if (start !== undefined && end !== undefined) {
      ranges.push({ start, end })
      cursor = limit
    } else cursor = index + 1
  }
  return ranges
}

export function Highlight({
  text,
  query,
  caseSensitive = false,
  ignoreDiacritics = false,
  parts,
  ...props
}: HighlightProps) {
  const locale = useLocale()
  const segmenter = useMemo(
    () => new Intl.Segmenter(supportedLocale(Intl.Segmenter, locale)),
    [locale]
  )
  const ranges = useMemo(
    () => findRanges(text, query, segmenter, caseSensitive, ignoreDiacritics),
    [text, query, segmenter, caseSensitive, ignoreDiacritics]
  )
  const content: ReactNode[] = []
  let cursor = 0
  for (const { start, end } of ranges) {
    if (start > cursor) content.push(text.slice(cursor, start))
    content.push(
      <mark
        key={start}
        data-slot="highlight-mark"
        className={cn(
          'rounded-[min(0.125rem,var(--rad-control-radius,0.125rem))] bg-[var(--rad-color-accent)] [color:var(--rad-color-accent-foreground)] [box-decoration-break:clone] forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]',
          parts?.mark?.className
        )}
        style={parts?.mark?.style}
      >
        {text.slice(start, end)}
      </mark>
    )
    cursor = end
  }
  if (cursor < text.length) content.push(text.slice(cursor))
  return (
    <span
      {...props}
      data-slot={joinIds('highlight', props['data-slot'])}
    >
      {content}
    </span>
  )
}

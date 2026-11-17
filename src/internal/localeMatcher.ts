import { supportedLocale } from './locale.js'

const asciiWords = /^[A-Za-z0-9 ]*$/

export function createLocaleMatcher(locale: string) {
  const collator = new Intl.Collator(supportedLocale(Intl.Collator, locale), {
    localeMatcher: 'lookup',
    usage: 'search',
    sensitivity: 'accent',
    ignorePunctuation: false
  })
  const segmenter = new Intl.Segmenter(supportedLocale(Intl.Segmenter, locale), {
    localeMatcher: 'lookup'
  })
  const matches = (left: string, right: string) => collator.compare(left, right) === 0

  function match(query: string, mode: 'prefix' | 'substring') {
    if (!query) return () => true
    const matchingLocale = collator.resolvedOptions().locale
    const foldedQuery = asciiWords.test(query) ? query.toLocaleLowerCase(matchingLocale) : undefined
    return (text: string) => {
      if (foldedQuery !== undefined && asciiWords.test(text)) {
        const folded = text.toLocaleLowerCase(matchingLocale)
        return mode === 'prefix' ? folded.startsWith(foldedQuery) : folded.includes(foldedQuery)
      }
      const offsets = [
        0,
        ...Array.from(segmenter.segment(text), ({ index, segment }) => index + segment.length)
      ]
      // A collation match can span a different number of graphemes than the query.
      const starts = mode === 'prefix' ? 1 : offsets.length - 1
      for (let start = 0; start < starts; start++) {
        for (let end = start + 1; end < offsets.length; end++) {
          if (matches(text.slice(offsets[start], offsets[end]), query)) return true
        }
      }
      return false
    }
  }

  return {
    match,
    typeaheadQuery(text: string) {
      const keys = Array.from(segmenter.segment(text), ({ segment }) => segment)
      const first = keys[0] ?? ''
      return keys.every(key => matches(key, first)) ? first : text
    },
    isSingleKey(text: string) {
      const first = segmenter.segment(text).containing(0)
      return first?.segment === text
    }
  }
}

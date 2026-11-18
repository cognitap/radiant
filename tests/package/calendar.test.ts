import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Calendar, LocaleProvider, type CalendarProps } from '@cognitap/radiant'

function markup(
  locale: string,
  overrides: Partial<Pick<CalendarProps, 'locale' | 'firstDayOfWeek' | 'calendar'>> = {}
) {
  return renderToStaticMarkup(
    h(
      LocaleProvider,
      { locale },
      h(Calendar, { 'aria-label': 'Day', today: '2024-02-29', ...overrides })
    )
  )
}

test('the installed calendar renders locale week starts, numbering and calendar years on the server', () => {
  for (const [locale, first] of [
    ['en-US', '2024-01-28'],
    ['en-GB', '2024-01-29'],
    ['fr-FR', '2024-01-29'],
    ['de-DE', '2024-01-29'],
    ['he-IL', '2024-01-28'],
    ['ar-EG', '2024-01-27'],
    ['th-TH', '2024-01-28']
  ]) {
    const html = markup(locale)
    const firstName = new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }).format(
      new Date(first)
    )
    assert.equal(html.match(/<th\b[^>]* abbr="([^"]+)"/)?.[1], firstName)
    assert.match(html, /data-date="2024-02-29"/)
  }
  assert.match(markup('th-TH-u-nu-thai'), /๒๕๖๗/)
  assert.match(markup('en-US', { firstDayOfWeek: 5 }), /<th\b[^>]* abbr="Friday"/)
  assert.match(markup('en-US', { locale: 'en-US-u-ca-hebrew' }), />February 2024</)
  assert.match(markup('en-US', { calendar: 'buddhist' }), /2567/)
})

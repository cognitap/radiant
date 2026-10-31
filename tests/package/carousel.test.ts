import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  Carousel,
  CarouselViewport,
  CarouselNext,
  CarouselPrevious,
  CarouselIndicators,
  CarouselAutoPlay,
  defineTheme,
  useCarousel
} from '@cognitap/radiant'
const items = [
  { value: 'atlas', label: 'Atlas', children: h('p', null, 'Atlas research') },
  { value: 'harbor', label: 'Harbor', children: h('p', null, 'Harbor research') }
]
test('Carousel server rendering labels native snap slides and composes real Button actions', () => {
  const html = renderToStaticMarkup(
    h(
      Carousel,
      { 'aria-label': 'Studies', items },
      h(CarouselViewport),
      h(CarouselPrevious, null, 'Previous'),
      h(CarouselNext, null, 'Next'),
      h(CarouselIndicators),
      h(CarouselAutoPlay)
    )
  )
  assert.match(html, /<section/)
  assert.match(html, /aria-roledescription="carousel"/)
  assert.match(html, /aria-label="Atlas, 1 of 2"/)
  assert.match(html, /aria-label="Harbor, 2 of 2"/)
  assert.match(html, /data-rad-carousel-value="harbor"/)
  assert.match(html, /inert=""/)
  assert.match(html, /data-slot="button carousel-next"/)
  assert.match(html, /Play slides/)
  assert.doesNotMatch(html, / aria-pressed="/)
})
test('Carousel validates keyed items, owner contradictions, timing and orphan parts', () => {
  assert.throws(
    () =>
      renderToStaticMarkup(h(Carousel, { 'aria-label': 'Invalid', items: [...items, items[0]!] })),
    /unique nonempty/
  )
  assert.throws(
    () => renderToStaticMarkup(h(Carousel, { 'aria-label': 'Invalid', items, interval: 0 })),
    /at least 1000/
  )
  assert.throws(
    () => renderToStaticMarkup(h(Carousel, { 'aria-label': 'Invalid', items, value: 'missing' })),
    /match an item/
  )
  assert.throws(
    () =>
      renderToStaticMarkup(
        h(Carousel, {
          'aria-label': 'Invalid',
          items,
          value: 'atlas',
          defaultValue: 'harbor'
        } as never)
      ),
    /controlled value or a default/
  )
  assert.throws(() => renderToStaticMarkup(h(CarouselViewport)), /inside Carousel/)
  assert.ok(
    defineTheme({
      id: 'gallery',
      name: 'Gallery',
      components: { carousel: { gap: '12px', slideGap: '4px', radius: '8px' } }
    })
  )
  function Outside() {
    assert.equal(useCarousel(), null)
    return null
  }
  renderToStaticMarkup(h(Outside))
})

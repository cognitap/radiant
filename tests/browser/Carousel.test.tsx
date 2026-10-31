import { act, createRef, StrictMode } from 'react'
import { expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import {
  Carousel,
  CarouselViewport,
  CarouselPrevious,
  CarouselNext,
  CarouselIndicators,
  CarouselAutoPlay,
  Input,
  useCarousel,
  type CarouselProps
} from '../../src/index.js'
import type { DistributiveOmit } from '../../src/internal/types.js'
import { mount, click, key, pause } from './familyHarness.js'
const items = [
  {
    value: 'atlas',
    label: 'Atlas',
    children: (
      <div className="relative h-32 p-4">
        <p>Atlas research</p>
        <span
          aria-hidden="true"
          data-test="drag-target"
          style={{ position: 'absolute', right: 16, top: 16, width: 16, height: 16 }}
        />
        <Input
          aria-label="Atlas notes"
          defaultValue="Retain this draft"
        />
      </div>
    )
  },
  { value: 'harbor', label: 'Harbor', children: <div className="h-32 p-4">Harbor research</div> },
  { value: 'orchard', label: 'Orchard', children: <div className="h-32 p-4">Orchard research</div> }
]
function Sample(props: DistributiveOmit<CarouselProps, 'aria-label' | 'items'>) {
  return (
    <Carousel
      aria-label="Research"
      items={items}
      style={{ width: 320 }}
      {...props}
    >
      <CarouselViewport data-test="viewport" />
      <CarouselPrevious>Previous</CarouselPrevious>
      <CarouselNext>Next</CarouselNext>
      <CarouselIndicators />
      <CarouselAutoPlay />
    </Carousel>
  )
}
const viewport = (host: ParentNode) =>
  host.querySelector<HTMLDivElement>('[data-slot~="carousel-viewport"]')!
const next = (host: ParentNode) =>
  host.querySelector<HTMLButtonElement>('[data-slot~="carousel-next"]')!
const selected = (host: ParentNode) =>
  host.querySelector<HTMLElement>('[data-slot~="carousel-slide"][data-selected]')?.dataset
    .radCarouselValue
async function aligned(host: ParentNode, value: string) {
  await vi.waitFor(() => {
    expect(selected(host)).toBe(value)
    const root = viewport(host).getBoundingClientRect(),
      slide = host
        .querySelector<HTMLElement>(`[data-rad-carousel-value="${value}"]`)!
        .getBoundingClientRect()
    expect(Math.abs(slide.left - root.left)).toBeLessThan(1)
  })
}
test('SSR hydration retains native hosts, refs, n of m labels and actual scroll-snap CSS', async () => {
  const ref = createRef<HTMLElement>(),
    scrollRef = createRef<HTMLDivElement>()
  const { host } = await mount(
    <StrictMode>
      <Carousel
        aria-label="Gallery"
        items={items}
        ref={ref}
        style={{ width: 320, '--rad-carousel-gap': '20px' }}
      >
        <CarouselViewport
          ref={scrollRef}
          aria-label="Study slides"
        />
        <CarouselNext>Next</CarouselNext>
      </Carousel>
    </StrictMode>,
    true
  )
  expect(ref.current?.tagName).toBe('SECTION')
  expect(scrollRef.current).toBe(viewport(host))
  expect(scrollRef.current).toHaveAccessibleName('Study slides')
  expect(getComputedStyle(viewport(host)).scrollSnapType).toBe('x mandatory')
  expect(getComputedStyle(ref.current!).gap).toBe('20px')
  expect(host.querySelector('[data-rad-carousel-value="atlas"]')?.getAttribute('aria-label')).toBe(
    'Atlas, 1 of 3'
  )
  expect(host.querySelector('[data-rad-carousel-value="harbor"]')?.hasAttribute('inert')).toBe(true)
})
test('next, previous and indicators select without moving action focus; drafts survive navigation', async () => {
  const { host } = await mount(<Sample />),
    input = host.querySelector<HTMLInputElement>('input')!
  await act(async () => userEvent.fill(input, 'Saved draft'))
  await click(next(host))
  await aligned(host, 'harbor')
  expect(document.activeElement).toBe(next(host))
  await click(host.querySelector<HTMLButtonElement>('[data-slot~="carousel-previous"]')!)
  await aligned(host, 'atlas')
  expect(input.value).toBe('Saved draft')
  await click(host.querySelector<HTMLButtonElement>('[aria-label="Show slide 3 of 3"]')!)
  await aligned(host, 'orchard')
  expect(next(host).disabled).toBe(true)
})
test('viewport arrows, Home and End obey RTL and leave nested control keys native', async () => {
  const { host } = await mount(<Sample dir="rtl" />),
    scroll = viewport(host)
  await act(async () => scroll.focus())
  await key('{ArrowLeft}')
  await aligned(host, 'harbor')
  await key('{End}')
  await aligned(host, 'orchard')
  await key('{Home}')
  await aligned(host, 'atlas')
  const input = host.querySelector<HTMLInputElement>('input')!
  await act(async () => input.focus())
  await key('{ArrowLeft}')
  expect(selected(host)).toBe('atlas')
})
test('real mouse drag and touch swipe use the native scroll viewport', async () => {
  const changes = vi.fn(),
    { host } = await mount(<Sample onValueChange={changes} />)
  viewport(host).id = 'carousel-native-proof'
  await act(async () =>
    commands.dragHandle('#carousel-native-proof [data-test=drag-target]', -230, false, false)
  )
  await aligned(host, 'harbor')
  expect(changes).toHaveBeenCalledWith('harbor')
  await act(async () => commands.scrollViewport('#carousel-native-proof', 230, 0, true))
  await aligned(host, 'orchard')
})
test('controlled requests may be refused and native scroll restores the owned selection', async () => {
  const changes = vi.fn(),
    { host, render } = await mount(
      <Sample
        value="atlas"
        onValueChange={changes}
      />
    )
  await click(next(host))
  expect(changes).toHaveBeenCalledWith('harbor')
  expect(selected(host)).toBe('atlas')
  changes.mockClear()
  await act(async () => viewport(host).scrollTo({ left: 320, behavior: 'instant' }))
  await vi.waitFor(() => expect(changes).toHaveBeenCalledTimes(1))
  await aligned(host, 'atlas')
  await render(
    <Sample
      value="orchard"
      onValueChange={changes}
    />
  )
  await aligned(host, 'orchard')
  expect(changes).toHaveBeenCalledTimes(1)
})
test('autoplay is off by default and pauses for hover, focus and reduced motion', async () => {
  const changes = vi.fn(),
    { host, render } = await mount(
      <Sample
        interval={1000}
        onValueChange={changes}
      />
    )
  await pause(1100)
  expect(changes).not.toHaveBeenCalled()
  await render(
    <Sample
      interval={1000}
      autoPlay
      onValueChange={changes}
    />
  )
  await act(async () => userEvent.hover(viewport(host)))
  await pause(1100)
  expect(changes).not.toHaveBeenCalled()
  await act(async () => userEvent.unhover(viewport(host)))
  await act(async () => viewport(host).focus())
  await pause(1100)
  expect(changes).not.toHaveBeenCalled()
  await act(async () => viewport(host).blur())
  await commands.emulatePreferences({ reducedMotion: 'reduce' })
  await pause(1100)
  expect(changes).not.toHaveBeenCalled()
  await commands.emulatePreferences({ reducedMotion: 'no-preference' })
  await vi.waitFor(() => expect(changes).toHaveBeenCalledWith('harbor'), { timeout: 2000 })
})
test('explicit navigation stops playback and reduced motion snaps without smooth scrolling', async () => {
  await commands.emulatePreferences({ reducedMotion: 'reduce', forcedColors: 'active' })
  const { host } = await mount(
    <Sample
      autoPlay
      interval={1000}
      dir="rtl"
    />
  )
  await click(next(host))
  await aligned(host, 'harbor')
  expect(host.querySelector('[data-slot~="carousel-auto-play"]')?.textContent).toBe('Play slides')
  expect(host.querySelector('section')?.hasAttribute('data-playing')).toBe(false)
})
test('caller cancellation wins; hooks are absent outside and empty collections stay safe', async () => {
  function Outside() {
    expect(useCarousel()).toBeNull()
    return null
  }
  await mount(<Outside />)
  const { host } = await mount(
    <Carousel
      aria-label="Empty"
      items={[]}
    >
      <CarouselViewport />
      <CarouselPrevious>Previous</CarouselPrevious>
      <CarouselNext onClick={event => event.preventDefault()}>Next</CarouselNext>
      <CarouselIndicators />
    </Carousel>
  )
  expect(next(host).disabled).toBe(true)
  expect(host.querySelectorAll('[data-slot~="carousel-slide"]').length).toBe(0)
})

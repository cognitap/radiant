import { createRef } from 'react'
import {
  Carousel,
  CarouselViewport,
  CarouselPrevious,
  CarouselNext,
  CarouselIndicators,
  CarouselAutoPlay,
  defineTheme,
  type CarouselItem
} from '../../src/index.js'
const items: CarouselItem[] = [
  { value: 'atlas', children: <p>Atlas research</p> },
  { value: 'harbor', children: <p>Harbor reading</p> }
]
export const gallery = (
  <Carousel
    aria-label="Research"
    items={items}
    value="atlas"
    onValueChange={() => {}}
    ref={createRef<HTMLElement>()}
    slideLabel={(index, count) => `${index + 1}/${count}`}
  >
    <CarouselViewport ref={createRef<HTMLDivElement>()} />
    <CarouselPrevious>Previous</CarouselPrevious>
    <CarouselNext>Next</CarouselNext>
    <CarouselIndicators indicatorLabel={index => `Review study ${index + 1}`} />
    <CarouselAutoPlay />
  </Carousel>
)
export const theme = defineTheme({
  id: 'carousel-test',
  name: 'Carousel test',
  components: { carousel: { gap: '20px', slideGap: '4px', radius: '12px' } }
})
// @ts-expect-error A carousel has a name.
export const unnamed = <Carousel items={items} />
// @ts-expect-error Selection has one owner.
export const mixed = (
  <Carousel
    aria-label="Research"
    items={items}
    value="atlas"
    defaultValue="harbor"
  />
)
// @ts-expect-error Navigation actions do not toggle.
export const toggle = <CarouselNext pressed>Next</CarouselNext>
export const undefinedToggle = (
  <CarouselNext
    pressed={undefined}
    defaultPressed={undefined}
    onPressedChange={undefined}
    aria-pressed={undefined}
  >
    Next
  </CarouselNext>
)
// @ts-expect-error Carousel owns viewport contents and its connected ID.
export const replaced = <CarouselViewport id="different">Custom slides</CarouselViewport>

import { createRef } from 'react'
import {
  Carousel,
  CarouselViewport,
  CarouselPrevious,
  CarouselNext,
  CarouselIndicators,
  CarouselAutoPlay,
  defineTheme,
  useCarousel,
  type CarouselItem,
  type CarouselAutoPlayProps
} from '@cognitap/radiant'
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
    <CarouselIndicators
      controlSize="small"
      indicatorLabel={index => `Review study ${index + 1}`}
    />
    <CarouselAutoPlay
      playLabel="Resume studies"
      pauseLabel="Stop studies"
    />
  </Carousel>
)
export const theme = defineTheme({
  id: 'carousel-test',
  name: 'Carousel test',
  components: { carousel: { gap: '20px', slideGap: '4px', radius: '12px' } }
})
// @ts-expect-error A carousel has a name.
export const unnamed = <Carousel items={items} />
export const mixed = (
  // @ts-expect-error Selection has one owner.
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
// @ts-expect-error The autoplay action names itself from playLabel and pauseLabel.
export const autoPlayText = <CarouselAutoPlay>Pause</CarouselAutoPlay>
// TSX accepts any hyphenated attribute, so the props type is checked with object literals.
export const autoPlayLabel: CarouselAutoPlayProps = {
  // @ts-expect-error A fixed name would hide the Play/Pause text; use playLabel and pauseLabel.
  'aria-label': 'Autoplay'
}
export const autoPlayLabelledBy: CarouselAutoPlayProps = {
  // @ts-expect-error A fixed name would hide the Play/Pause text; use playLabel and pauseLabel.
  'aria-labelledby': 'autoplay-name'
}
export const autoPlayProps: CarouselAutoPlayProps = { playLabel: 'Play', variant: 'ghost' }
export function useSelection() {
  const state = useCarousel()
  // @ts-expect-error Playback is owned by CarouselAutoPlay, not the hook.
  return [state?.index, state?.count, state?.playing]
}

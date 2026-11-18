import { Tour, TourTrigger, type TourProps, type TourStep } from '@cognitap/radiant'

const steps: TourStep[] = [{ target: '#search', title: 'Find a project', side: 'bottom' }]
export const onboarding = (
  <Tour
    steps={steps}
    open={false}
    onOpenChange={open => Boolean(open)}
  >
    <TourTrigger>Start tour</TourTrigger>
    <button id="search">Search</button>
  </Tour>
)
// @ts-expect-error Tour has one open state owner.
export const ambiguous: TourProps = { steps, open: true, defaultOpen: true }

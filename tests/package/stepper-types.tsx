import { Stepper, type StepperProps, type StepperStep } from '@cognitap/radiant'

const steps: readonly StepperStep[] = [
  { value: 'name', label: 'Name', completed: true },
  { value: 'address', label: 'Address', error: 'Enter a city.' }
]

export const flow = (
  <Stepper
    aria-label="Delivery progress"
    steps={steps}
    value="address"
    onValueChange={next => next.toUpperCase()}
    navigation="free"
    orientation="vertical"
    statusLabels={{ error: 'Action required' }}
    parts={{ connector: { className: 'opacity-75' } }}
  />
)

// @ts-expect-error Controlled value and default value are mutually exclusive.
export const ambiguous: StepperProps = {
  'aria-label': 'Steps',
  steps,
  value: 'name',
  defaultValue: 'address'
}
// @ts-expect-error The navigation landmark needs an accessible name.
export const missingName: StepperProps = { steps }

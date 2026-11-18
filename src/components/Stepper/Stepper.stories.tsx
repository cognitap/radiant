import { useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../Button/Button.js'
import { Field } from '../Field/Field.js'
import { Input } from '../Input/Input.js'
import { LocaleProvider } from '../LocaleProvider/LocaleProvider.js'
import { Stepper, type StepperStep } from './Stepper.js'

const shipment: readonly StepperStep[] = [
  { value: 'address', label: 'Address' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'review', label: 'Review' }
]

const meta = {
  title: 'Components/Stepper',
  component: Stepper,
  args: {
    'aria-label': 'Shipping setup',
    steps: shipment,
    defaultValue: 'delivery',
    className: 'w-full max-w-xl'
  },
  parameters: {
    docs: {
      description: {
        component:
          'Show progress through an ordered workflow. Linear navigation allows earlier steps and the next enabled step. Free navigation allows any enabled step. The current step uses aria-current, and text identifies completion and errors. A controlled flow can validate a step before accepting the next value.'
      }
    }
  }
} satisfies Meta<typeof Stepper>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const SharedControlSizes: Story = {
  render: () => (
    <div className="grid w-full max-w-xl gap-4">
      {(['small', 'medium', 'large'] as const).map(size => (
        <Stepper
          key={size}
          aria-label={size[0].toUpperCase() + size.slice(1) + ' shipping steps'}
          steps={shipment}
          defaultValue="delivery"
          controlSize={size}
        />
      ))}
    </div>
  )
}

const setup = [
  { value: 'workspace', label: 'Workspace', field: 'Workspace name' },
  { value: 'contact', label: 'Contact', field: 'Contact email' },
  { value: 'review', label: 'Review', field: '' }
]

function CreateWorkspace() {
  const [index, setIndex] = useState(0)
  const [workspace, setWorkspace] = useState('')
  const [email, setEmail] = useState('')
  const [created, setCreated] = useState(false)
  const form = useRef<HTMLFormElement>(null)
  const current = setup[index]
  const reviewing = current.value === 'review'

  return (
    <div className="grid w-full max-w-xl gap-5">
      <Stepper
        aria-label="Workspace setup"
        steps={created ? setup.map(step => ({ ...step, completed: true, disabled: true })) : setup}
        value={current.value}
        onValueChange={value => {
          const next = setup.findIndex(step => step.value === value)
          if (next < index || form.current?.reportValidity()) setIndex(next)
        }}
      />
      {created ? (
        <output aria-live="polite">{workspace} is ready.</output>
      ) : (
        <form
          ref={form}
          className="grid gap-4"
          onSubmit={event => {
            event.preventDefault()
            if (reviewing) setCreated(true)
            else setIndex(index + 1)
          }}
        >
          {reviewing ? (
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm">
              <dt className="font-semibold">Workspace</dt>
              <dd>{workspace}</dd>
              <dt className="font-semibold">Contact</dt>
              <dd>{email}</dd>
            </dl>
          ) : (
            <Field
              label={current.field}
              required
            >
              <Input
                key={current.value}
                type={index === 0 ? 'text' : 'email'}
                value={index === 0 ? workspace : email}
                onChange={event => {
                  if (index === 0) setWorkspace(event.currentTarget.value)
                  else setEmail(event.currentTarget.value)
                }}
              />
            </Field>
          )}
          <div className="flex justify-between gap-2">
            <Button
              variant="outline"
              disabled={index === 0}
              onClick={() => setIndex(index - 1)}
            >
              Back
            </Button>
            <Button type="submit">{reviewing ? 'Create workspace' : 'Continue'}</Button>
          </div>
        </form>
      )}
    </div>
  )
}

export const Controlled: Story = {
  name: 'Create a workspace',
  render: () => <CreateWorkspace />
}

export const ReviewApplication: Story = {
  args: {
    'aria-label': 'Application review',
    orientation: 'vertical',
    navigation: 'free',
    defaultValue: 'references',
    className: 'w-full max-w-sm',
    steps: [
      { value: 'profile', label: 'Profile', completed: true },
      { value: 'references', label: 'References', error: 'Add a second reference.' },
      { value: 'documents', label: 'Documents', completed: true },
      { value: 'submit', label: 'Submit' }
    ]
  }
}

export const TrackAnOrderInHebrew: Story = {
  render: () => (
    <LocaleProvider locale="he-IL">
      <Stepper
        className="w-full max-w-xl"
        aria-label="מעקב הזמנה"
        steps={[
          { value: 'approved', label: 'אישור' },
          { value: 'packing', label: 'אריזה' },
          { value: 'shipped', label: 'משלוח' }
        ]}
        defaultValue="packing"
        statusLabels={{ completed: 'הושלם', current: 'נוכחי', upcoming: 'בהמשך' }}
      />
    </LocaleProvider>
  )
}

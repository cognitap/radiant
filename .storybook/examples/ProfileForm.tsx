import { useRef, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Field,
  Input,
  Radio,
  RadioGroup,
  type InputProps
} from '../../src/index.js'

export type FormOwner = 'native' | 'tanstack'
export type FormPlacement = 'standalone' | 'card' | 'dialog'
type Profile = { email: string; updates: boolean; plan: string }
type FormCallbacks = { onSaved: (profile: Profile) => void; onReset: () => void; label?: string }

const defaults: Profile = { email: '', updates: true, plan: 'free' }
const formStyle = { display: 'grid', gap: 'var(--rad-spacing-group-gap, 1rem)', minWidth: 0 }

function validateEmail(value: string) {
  if (!value.trim()) return 'Enter an email.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email.'
}

function Email({ error, ...props }: InputProps & { error?: string }) {
  return (
    <Field
      label="Email"
      description="We send account updates here."
      error={error}
      required
    >
      <Input
        {...props}
        type="email"
        autoComplete="email"
      />
    </Field>
  )
}

function PlanOptions() {
  return (
    <>
      <Radio
        label="Free"
        value="free"
      />
      <Radio
        label="Pro"
        value="pro"
      />
      <Radio
        label="Retired"
        value="retired"
        disabled
      />
    </>
  )
}

function ManagedWorkspace() {
  return (
    <Field
      label="Workspace"
      description="Managed by your organisation."
      disabled
    >
      <Input
        name="workspace"
        defaultValue="Cognitap"
      />
    </Field>
  )
}

function Actions() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      <Button type="submit">Save profile</Button>
      <Button
        type="reset"
        variant="outline"
        tone="neutral"
      >
        Reset
      </Button>
    </div>
  )
}

function NativeProfileForm({ onSaved, onReset, label = 'Profile' }: FormCallbacks) {
  const emailRef = useRef<HTMLInputElement>(null)
  const touched = useRef(false)
  const [error, setError] = useState<string>()
  return (
    <form
      aria-label={label}
      noValidate
      style={formStyle}
      onSubmit={event => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        const email = String(data.get('email') ?? '')
        const message = validateEmail(email)
        touched.current = true
        setError(message)
        if (message) {
          emailRef.current?.focus()
          return
        }
        onSaved({ email, updates: data.has('updates'), plan: String(data.get('plan')) })
      }}
      onReset={() => {
        touched.current = false
        setError(undefined)
        onReset()
      }}
    >
      <Email
        ref={emailRef}
        name="email"
        defaultValue={defaults.email}
        error={error}
        onChange={event => {
          if (touched.current) setError(validateEmail(event.currentTarget.value))
        }}
        onBlur={event => {
          touched.current = true
          setError(validateEmail(event.currentTarget.value))
        }}
      />
      <Checkbox
        label="Send product updates"
        name="updates"
        value="yes"
        defaultChecked={defaults.updates}
      />
      <RadioGroup
        label="Plan"
        name="plan"
        description="Choose one plan."
        defaultValue={defaults.plan}
        required
      >
        <PlanOptions />
      </RadioGroup>
      <ManagedWorkspace />
      <Actions />
    </form>
  )
}

function TanStackProfileForm({ onSaved, onReset, label = 'Profile' }: FormCallbacks) {
  const emailRef = useRef<HTMLInputElement>(null)
  const form = useForm({
    defaultValues: defaults,
    onSubmit: ({ value }) => onSaved(value),
    onSubmitInvalid: () => emailRef.current?.focus()
  })
  return (
    <form
      aria-label={label}
      noValidate
      style={formStyle}
      onSubmit={event => {
        event.preventDefault()
        void form.handleSubmit()
      }}
      onReset={event => {
        // Controlled values and validation metadata have the same owner.
        event.preventDefault()
        form.reset()
        onReset()
      }}
    >
      <form.Field
        name="email"
        validators={{
          onBlur: ({ value }) => validateEmail(value)
        }}
      >
        {field => {
          const message = field.state.meta.errors[0]
          return (
            <Email
              ref={emailRef}
              name={field.name}
              value={field.state.value}
              error={
                field.state.meta.isTouched && typeof message === 'string' ? message : undefined
              }
              onChange={event => {
                field.handleChange(event.currentTarget.value)
                // Revalidate the same rule so a prior blur error cannot stay stale.
                if (field.state.meta.isBlurred || form.state.submissionAttempts > 0) {
                  void field.validate('blur')
                }
              }}
              onBlur={() => field.handleBlur()}
            />
          )
        }}
      </form.Field>
      <form.Field name="updates">
        {field => (
          <Checkbox
            label="Send product updates"
            name={field.name}
            value="yes"
            checked={field.state.value}
            onChange={event => field.handleChange(event.currentTarget.checked)}
            onBlur={() => field.handleBlur()}
          />
        )}
      </form.Field>
      <form.Field name="plan">
        {field => (
          <RadioGroup
            label="Plan"
            name={field.name}
            description="Choose one plan."
            required
            value={field.state.value}
            onValueChange={value => field.handleChange(value)}
            onBlur={event => {
              if (!event.currentTarget.contains(event.relatedTarget)) field.handleBlur()
            }}
          >
            <PlanOptions />
          </RadioGroup>
        )}
      </form.Field>
      <ManagedWorkspace />
      <Actions />
    </form>
  )
}

/** The owner changes; the form is reused unchanged in each surface. */
export function ProfileExample({
  owner,
  placement,
  label = 'Profile'
}: {
  owner: FormOwner
  placement: FormPlacement
  label?: string
}) {
  const [saved, setSaved] = useState<Profile>()
  const [open, setOpen] = useState(false)
  const Form = owner === 'native' ? NativeProfileForm : TanStackProfileForm
  const content = (
    <Form
      label={label}
      onSaved={profile => {
        setSaved(profile)
        setOpen(false)
      }}
      onReset={() => setSaved(undefined)}
    />
  )
  return (
    <div
      style={{
        width: 'min(30rem, calc(100vw - 2rem))',
        maxWidth: '100%',
        display: 'grid',
        gap: '1rem'
      }}
    >
      {placement === 'card' ? (
        <Card>
          <CardHeader>
            <CardTitle>Profile preferences</CardTitle>
            <CardDescription>Update your email and plan.</CardDescription>
          </CardHeader>
          <CardContent>{content}</CardContent>
        </Card>
      ) : placement === 'dialog' ? (
        <Dialog
          open={open}
          onOpenChange={setOpen}
        >
          <DialogTrigger>Edit profile</DialogTrigger>
          <DialogContent>
            <DialogTitle>Profile preferences</DialogTitle>
            <DialogDescription>Update your email and plan.</DialogDescription>
            {content}
            <DialogClose
              variant="ghost"
              tone="neutral"
            >
              Cancel
            </DialogClose>
          </DialogContent>
        </Dialog>
      ) : (
        content
      )}
      <output aria-live="polite">
        {saved
          ? `Saved ${saved.email} · ${saved.plan} · Updates ${saved.updates ? 'on' : 'off'}`
          : 'No changes saved.'}
      </output>
    </div>
  )
}

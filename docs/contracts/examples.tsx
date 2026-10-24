/**
 * Compile-only future API acceptance examples. Never execute or bundle this
 * file: ./target.js intentionally has no runtime implementation.
 */
import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useForm } from '@tanstack/react-form'
import {
  Button,
  Checkbox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Field,
  Input,
  Link,
  Radio,
  RadioGroup,
  ThemeScope,
  defineTheme
} from './target.js'
import type { ThemeStyle } from './target.js'

const studio = defineTheme({
  id: 'studio',
  name: 'Studio',
  tokens: {
    color: { accent: 'oklch(0.52 0.16 260)', surface: 'white', foreground: 'oklch(0.2 0.02 260)' },
    typography: { family: 'system-ui, sans-serif', labelWeight: 600 },
    control: { radius: '0.5rem', medium: { height: '2.5rem', paddingInline: '0.75rem' } },
    surface: { canvas: 'linear-gradient(white, #eef2ff)' },
    focus: { width: '2px', offset: '2px', style: 'solid' }
  },
  components: { button: { shadow: 'none' }, dialog: { width: '32rem' } },
  modes: {
    dark: {
      tokens: {
        color: { surface: '#18181b', foreground: '#fafafa' },
        surface: { canvas: 'linear-gradient(#09090b, #18181b)' }
      }
    }
  }
})

/** Shared roles inherit; a component override only changes its named family. */
const localInputStyle = { '--rad-input-radius': '0.25rem' } satisfies ThemeStyle

export function StandaloneControl() {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <ThemeScope
      theme={studio}
      mode="system"
    >
      <Button
        controlSize="medium"
        variant="solid"
        tone="accent"
      >
        Save changes
      </Button>
      <Input
        aria-label="Search"
        type="search"
        size={24}
        controlSize="small"
        ref={inputRef}
      />
    </ThemeScope>
  )
}

type ProfileFieldsProps = { emailError?: string }
function ProfileFields({ emailError }: ProfileFieldsProps) {
  const groupRef = useRef<HTMLFieldSetElement>(null)
  return (
    <>
      <Field
        label="Email"
        description="We send account updates here."
        error={emailError}
        required
        parts={{ description: { style: { fontStyle: 'italic' } } }}
      >
        <Input
          name="email"
          type="email"
          autoComplete="email"
          defaultValue="ada@example.com"
          controlSize="medium"
          style={localInputStyle}
        />
      </Field>
      <Checkbox
        name="updates"
        value="yes"
        label="Send product updates"
        defaultChecked
      />
      <RadioGroup
        label="Plan"
        description="Choose one plan."
        name="plan"
        defaultValue="pro"
        required
        ref={groupRef}
        parts={{ options: { style: { display: 'flex', gap: '1rem' } } }}
      >
        <Radio
          value="free"
          label="Free"
        />
        <Radio
          value="pro"
          label="Pro"
        />
        <Radio
          value="retired"
          label="Retired"
          disabled
        />
      </RadioGroup>
      <p>
        <Link
          href="/privacy"
          variant="inline"
          tone="accent"
        >
          Privacy policy
        </Link>
      </p>
    </>
  )
}

function ProfileActions() {
  return (
    <div>
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

function ProfileForm({ onSaved }: { onSaved?: () => void }) {
  const [emailError, setEmailError] = useState<string>()
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const email = String(data.get('email') ?? '')
    if (!email.trim()) {
      setEmailError('Enter an email.')
      return
    }
    setEmailError(undefined)
    onSaved?.()
  }
  return (
    <form
      onSubmit={submit}
      onReset={() => setEmailError(undefined)}
    >
      <ProfileFields emailError={emailError} />
      <ProfileActions />
    </form>
  )
}

export function NativeForm() {
  return (
    <ThemeScope
      theme={studio}
      mode="light"
    >
      <ProfileForm />
    </ThemeScope>
  )
}

/** The same form and actions are reused; Dialog adds no enclosing form. */
export function FormInDialog({ allowOpen = true }: { allowOpen?: boolean }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const contentRef = useRef<HTMLDialogElement>(null)
  return (
    <ThemeScope
      theme={studio}
      mode="system"
    >
      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <DialogTrigger
          variant="outline"
          tone="neutral"
          ref={triggerRef}
          onClick={event => {
            if (!allowOpen) event.preventDefault()
          }}
        >
          Edit profile
        </DialogTrigger>
        <DialogContent ref={contentRef}>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>Update your email and plan.</DialogDescription>
          <ProfileForm onSaved={() => setOpen(false)} />
          <DialogClose
            variant="ghost"
            tone="neutral"
          >
            Cancel
          </DialogClose>
        </DialogContent>
      </Dialog>
    </ThemeScope>
  )
}

/** A router adapter preserves the resolved anchor props, including its ref. */
export function RouterLinkAdapter() {
  const anchorRef = useRef<HTMLAnchorElement>(null)
  return (
    <Link
      href="/account"
      ref={anchorRef}
      render={props => <a {...props}>{props.children}</a>}
    >
      Account
    </Link>
  )
}

/** A native host opts into Field relationships explicitly; no child cloning. */
export function NativeFieldAdapter() {
  return (
    <Field
      label="Notes"
      controlId="notes"
    >
      {control => (
        <textarea
          {...control}
          name="notes"
        />
      )}
    </Field>
  )
}

/** The installed TanStack package validates this adapter, not a mock API. */
export function TanStackForm() {
  const form = useForm({
    defaultValues: { email: '', updates: false, plan: 'free' },
    onSubmit: ({ value }) => {
      void value
    }
  })
  return (
    <ThemeScope theme={studio}>
      <form
        onSubmit={event => {
          event.preventDefault()
          void form.handleSubmit()
        }}
      >
        <form.Field
          name="email"
          validators={{ onBlur: ({ value }) => (value.trim() ? undefined : 'Enter an email.') }}
        >
          {field => {
            const firstError = field.state.meta.errors[0]
            const error = typeof firstError === 'string' ? firstError : undefined
            return (
              <Field
                label="Email"
                error={field.state.meta.isTouched ? error : undefined}
                required
              >
                <Input
                  name={field.name}
                  type="email"
                  value={field.state.value}
                  onChange={event => field.handleChange(event.currentTarget.value)}
                  onBlur={() => field.handleBlur()}
                />
              </Field>
            )
          }}
        </form.Field>
        <form.Field name="updates">
          {field => (
            <Checkbox
              label="Send product updates"
              name={field.name}
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
              value={field.state.value}
              onValueChange={value => field.handleChange(value)}
              onBlur={event => {
                if (!event.currentTarget.contains(event.relatedTarget)) field.handleBlur()
              }}
            >
              <Radio
                value="free"
                label="Free"
              />
              <Radio
                value="pro"
                label="Pro"
              />
            </RadioGroup>
          )}
        </form.Field>
        <Button type="submit">Save profile</Button>
        <Button
          type="button"
          variant="outline"
          tone="neutral"
          onClick={() => form.reset()}
        >
          Reset
        </Button>
      </form>
    </ThemeScope>
  )
}

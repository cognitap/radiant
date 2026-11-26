import { useId, useRef, useState, useSyncExternalStore } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Field,
  Input
} from '../../src/index.js'
import { MotionProvider, useSpringLayout } from '../../src/motion/react.js'

const subscribe = () => () => {}
const clientSnapshot = () => true
const serverSnapshot = () => false

export function FieldValidationExample() {
  return (
    <MotionProvider>
      <FieldValidationForm />
    </MotionProvider>
  )
}

function FieldValidationForm() {
  const form = useRef<HTMLFormElement>(null)
  const nameInput = useRef<HTMLInputElement>(null)
  const addressInput = useRef<HTMLInputElement>(null)
  const firstChannel = useRef<HTMLInputElement>(null)
  // Only dedicated wrappers move. Field, its input and its live error remain native.
  useSpringLayout(form)
  const ready = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot)
  const id = useId()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('orbit-studio')
  const [channels, setChannels] = useState<string[]>([])
  const [touched, setTouched] = useState({ name: false, address: false, channels: false })
  const [help, setHelp] = useState(true)
  const [locked, setLocked] = useState(false)
  const [feedback, setFeedback] = useState('Your next project starts here.')
  const nameError = name.trim().length < 2 ? 'Use at least two characters for your workspace.' : ''
  const addressError =
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(address) && address.length >= 3
      ? ''
      : 'Use at least three lowercase letters or numbers, separated by single hyphens.'
  const channelError =
    !locked && channels.length === 0 ? 'Choose at least one publishing channel.' : ''
  return (
    <Card style={{ minWidth: 0, maxWidth: '40rem' }}>
      <CardHeader>
        <CardTitle>Create a workspace</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <Checkbox
            label="Show helpful hints"
            checked={help}
            onChange={event => setHelp(event.target.checked)}
          />
          <Checkbox
            label="Lock publishing channels"
            checked={locked}
            onChange={event => setLocked(event.target.checked)}
          />
        </div>
        <form
          ref={form}
          aria-label="Create a workspace"
          noValidate
          style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1.5rem' }}
          onReset={() => {
            setName('')
            setAddress('orbit-studio')
            setChannels([])
            setTouched({ name: false, address: false, channels: false })
            setFeedback('Draft reset. Your next project starts here.')
          }}
          onSubmit={event => {
            event.preventDefault()
            setTouched({ name: true, address: true, channels: true })
            const invalid = nameError
              ? nameInput
              : addressError
                ? addressInput
                : channelError
                  ? firstChannel
                  : null
            if (invalid) {
              invalid.current?.focus()
              setFeedback('Check the highlighted fields, then try again.')
              return
            }
            const data = new FormData(event.currentTarget)
            setFeedback(
              `Created locally: ${String(data.get('workspace')).trim()} · ${String(data.get('address'))} · ${data.getAll('channels').join(', ') || 'channels locked'}.`
            )
          }}
        >
          <div
            data-rad-layout-slot=""
            style={{ display: 'flow-root' }}
          >
            <div data-rad-layout-part="">
              <Field
                label="Workspace name"
                controlId={`${id}-name`}
                required
                description={help ? 'Choose a name your teammates will recognize.' : undefined}
                error={touched.name ? nameError : undefined}
              >
                <Input
                  ref={nameInput}
                  name="workspace"
                  value={name}
                  autoComplete="organization"
                  onChange={event => setName(event.target.value)}
                  onBlur={() => setTouched(state => ({ ...state, name: true }))}
                />
              </Field>
            </div>
          </div>
          <div
            data-rad-layout-slot=""
            style={{ display: 'flow-root' }}
          >
            <div data-rad-layout-part="">
              <Field
                label="Workspace address"
                required
                description={help ? 'Use lowercase letters, numbers, and hyphens.' : undefined}
                error={touched.address ? addressError : undefined}
              >
                <Input
                  ref={addressInput}
                  name="address"
                  value={address}
                  autoCapitalize="none"
                  spellCheck={false}
                  onChange={event => setAddress(event.target.value)}
                  onBlur={() => setTouched(state => ({ ...state, address: true }))}
                />
              </Field>
            </div>
          </div>
          <div
            data-rad-layout-slot=""
            style={{ display: 'flow-root' }}
          >
            <div data-rad-layout-part="">
              <Field
                layout="group"
                label="Publishing channels"
                required
                disabled={locked}
                description={help ? 'Choose one or both channels.' : undefined}
                error={touched.channels ? channelError : undefined}
              >
                {['Email digest', 'Team feed'].map((label, index) => (
                  <Checkbox
                    key={label}
                    ref={index === 0 ? firstChannel : undefined}
                    label={label}
                    name="channels"
                    value={label}
                    checked={channels.includes(label)}
                    onChange={event => {
                      setChannels(values =>
                        event.target.checked
                          ? [...values, label]
                          : values.filter(value => value !== label)
                      )
                      setTouched(state => ({ ...state, channels: true }))
                    }}
                  />
                ))}
              </Field>
            </div>
          </div>
          <div
            data-rad-layout-slot=""
            style={{ display: 'flow-root' }}
          >
            <div
              data-rad-layout-part=""
              style={{ display: 'grid', gap: '1rem' }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem' }}>
                <Button
                  type="submit"
                  disabled={!ready}
                  style={{ minWidth: 0, maxWidth: '100%' }}
                >
                  Create workspace
                </Button>
                <Button
                  type="reset"
                  variant="outline"
                  tone="neutral"
                >
                  Reset draft
                </Button>
              </div>
              <output style={{ overflowWrap: 'anywhere' }}>{feedback}</output>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

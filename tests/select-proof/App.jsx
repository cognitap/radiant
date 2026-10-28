/* oxlint-disable jsx-a11y/prefer-tag-over-role -- This fixture deliberately compares a custom ARIA widget with native selects. */
import { useEffect, useRef, useState } from 'react'
import { Field, ThemeScope } from '../../dist/library/index.js'
import { themes } from '../../dist/library/examples/index.js'

const options = [
  { value: '', label: 'Choose a place' },
  { value: 'oslo', label: 'Oslo' },
  { value: 'paris', label: 'Paris', disabled: true },
  { value: 'rome', label: 'Rome' },
  { value: 'tokyo', label: 'Tokyo' }
]

// A comparison fixture, not a proposed public Select implementation.
function CustomCandidate({ id, name, required, disabled, ...relationships }) {
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const trigger = useRef(null)
  const popup = useRef(null)
  const input = useRef(null)
  const search = useRef({ text: '', time: 0 })
  const selected = options.find(option => option.value === value)
  useEffect(() => {
    const form = input.current.form
    const reset = () => {
      setValue('')
      popup.current.hidePopover()
    }
    form.addEventListener('reset', reset)
    return () => form.removeEventListener('reset', reset)
  }, [])
  const show = () => {
    setActive(options.indexOf(selected))
    popup.current.showPopover()
  }
  const choose = index => {
    if (options[index].disabled) return
    setValue(options[index].value)
    popup.current.hidePopover()
    trigger.current.focus()
  }
  const keyDown = event => {
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault()
      if (!open) {
        show()
        return
      }
      const enabled = options
        .map((option, index) => (!option.disabled ? index : -1))
        .filter(index => index >= 0)
      const current = enabled.indexOf(active)
      setActive(
        event.key === 'Home'
          ? enabled[0]
          : event.key === 'End'
            ? enabled.at(-1)
            : enabled[
                Math.max(
                  0,
                  Math.min(enabled.length - 1, current + (event.key === 'ArrowDown' ? 1 : -1))
                )
              ]
      )
    } else if (open && ['Enter', ' '].includes(event.key)) {
      event.preventDefault()
      choose(active)
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault()
      const time = performance.now()
      search.current = {
        text:
          (time - search.current.time < 700 ? search.current.text : '') + event.key.toLowerCase(),
        time
      }
      const index = options.findIndex(
        option => !option.disabled && option.label.toLowerCase().startsWith(search.current.text)
      )
      if (index >= 0) {
        if (!open) popup.current.showPopover()
        setActive(index)
      }
    }
  }
  return (
    <div className="custom-candidate">
      <input
        ref={input}
        type="hidden"
        name={name}
        value={value}
        disabled={disabled}
        required={required}
      />
      <button
        {...relationships}
        ref={trigger}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-required={required}
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={open ? `${id}-option-${active}` : undefined}
        disabled={disabled}
        onClick={() => (open ? popup.current.hidePopover() : show())}
        onKeyDown={keyDown}
      >
        {selected.label}
      </button>
      <div
        ref={popup}
        id={`${id}-list`}
        role="listbox"
        aria-label="Custom places"
        popover="auto"
        onToggle={event => setOpen(event.newState === 'open')}
      >
        {options.map((option, index) => (
          <div
            id={`${id}-option-${index}`}
            key={option.value}
            role="option"
            tabIndex={-1}
            aria-selected={value === option.value}
            aria-disabled={option.disabled || undefined}
            data-active={index === active || undefined}
            onMouseDown={event => event.preventDefault()}
            onClick={() => choose(index)}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                choose(index)
              }
            }}
          >
            {option.label}
          </div>
        ))}
      </div>
    </div>
  )
}

function NativeCandidate({ enhanced, ...props }) {
  return (
    <select
      {...props}
      className={enhanced ? 'native enhanced' : 'native classic'}
    >
      {options.map(option => (
        <option
          key={option.value}
          value={option.value}
          disabled={option.disabled}
        >
          {option.label}
        </option>
      ))}
    </select>
  )
}

function Candidate({ kind }) {
  const [controlled, setControlled] = useState('oslo')
  const [accept, setAccept] = useState(false)
  const [lastChange, setLastChange] = useState('none')
  const select = relationships =>
    kind === 'custom' ? (
      <CustomCandidate
        {...relationships}
        name={kind}
        required
      />
    ) : (
      <NativeCandidate
        {...relationships}
        name={kind}
        enhanced={kind === 'enhanced'}
        required
        defaultValue=""
        onChange={event => setLastChange(event.target.value)}
      />
    )
  return (
    <section
      aria-labelledby={`${kind}-heading`}
      data-candidate={kind}
    >
      <h2 id={`${kind}-heading`}>
        {kind === 'classic'
          ? 'Traditional native'
          : kind === 'enhanced'
            ? 'Customizable native'
            : 'Custom button + listbox'}
      </h2>
      <form onSubmit={event => event.preventDefault()}>
        <Field
          label="Place"
          description="A single destination"
          controlId={`${kind}-place`}
          required
        >
          {select}
        </Field>
        <output aria-label="Last native change">{lastChange}</output>
        <button type="reset">Reset</button>
        <button type="submit">Submit</button>
        <Field
          label="Disabled place"
          controlId={`${kind}-disabled`}
          disabled
        >
          {relationships =>
            kind === 'custom' ? (
              <CustomCandidate
                {...relationships}
                name="disabled-place"
              />
            ) : (
              <NativeCandidate
                {...relationships}
                name="disabled-place"
                enhanced={kind === 'enhanced'}
                defaultValue="oslo"
              />
            )
          }
        </Field>
        {kind !== 'custom' && (
          <>
            <Field
              label="Controlled place"
              controlId={`${kind}-controlled`}
            >
              {relationships => (
                <NativeCandidate
                  {...relationships}
                  name="controlled-place"
                  enhanced={kind === 'enhanced'}
                  value={controlled}
                  onChange={event => {
                    if (accept) setControlled(event.target.value)
                  }}
                />
              )}
            </Field>
          </>
        )}
      </form>
      {kind !== 'custom' && (
        <label>
          <input
            type="checkbox"
            checked={accept}
            onChange={event => setAccept(event.target.checked)}
          />{' '}
          Accept controlled changes
        </label>
      )}
    </section>
  )
}

export function App() {
  const [theme, setTheme] = useState('radiant')
  const [mode, setMode] = useState('light')
  const dialog = useRef(null)
  useEffect(() => {
    document.documentElement.dataset.hydrated = 'true'
  }, [])
  return (
    <ThemeScope
      theme={themes.find(candidate => candidate.id === theme)}
      mode={mode}
    >
      <main>
        <h1>Select platform proof</h1>
        <p>Comparison fixtures. None is a public Radiant Select.</p>
        <nav aria-label="Proof appearance">
          <label>
            Theme{' '}
            <select
              aria-label="Theme"
              value={theme}
              onChange={event => setTheme(event.target.value)}
            >
              {themes.map(theme => (
                <option
                  key={theme.id}
                  value={theme.id}
                >
                  {theme.id}
                </option>
              ))}
            </select>
          </label>
          <label>
            Mode{' '}
            <select
              aria-label="Mode"
              value={mode}
              onChange={event => setMode(event.target.value)}
            >
              <option>light</option>
              <option>dark</option>
            </select>
          </label>
        </nav>
        <div className="candidates">
          {['classic', 'enhanced', 'custom'].map(kind => (
            <Candidate
              key={kind}
              kind={kind}
            />
          ))}
        </div>
        <button onClick={() => dialog.current.showModal()}>Open dialog</button>
        <dialog
          ref={dialog}
          aria-labelledby="dialog-heading"
        >
          <h2 id="dialog-heading">Select in a modal</h2>
          <Field
            label="Dialog place"
            controlId="dialog-place"
          >
            {relationships => (
              <NativeCandidate
                {...relationships}
                enhanced
                defaultValue="oslo"
              />
            )}
          </Field>
          <button onClick={() => dialog.current.close()}>Close dialog</button>
        </dialog>
      </main>
    </ThemeScope>
  )
}

import { useEffect, useState } from 'react'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Combobox,
  Field,
  type ComboboxOption
} from '../../src/index.js'

export const cityOptions: ComboboxOption[] = [
  { value: 'amsterdam', label: 'Amsterdam' },
  { value: 'berlin', label: 'Berlin' },
  { value: 'budapest', label: 'Budapest' },
  { value: 'copenhagen', label: 'Copenhagen' },
  { value: 'lisbon', label: 'Lisbon', disabled: true },
  { value: 'london', label: 'London' },
  { value: 'oslo', label: 'Oslo' },
  { value: 'paris', label: 'Paris' },
  { value: 'rome', label: 'Rome' },
  { value: 'stockholm', label: 'Stockholm' },
  { value: 'vienna', label: 'Vienna' }
]

export function ComboboxTravelExample() {
  const [feedback, setFeedback] = useState('Your next chapter starts somewhere.')
  return (
    <Card className="w-[28rem] max-w-full">
      <CardHeader>
        <CardTitle>A change of scenery</CardTitle>
        <CardDescription>Find a place for the next team gathering.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-6"
          onSubmit={event => {
            event.preventDefault()
            const data = new FormData(event.currentTarget)
            setFeedback(`Destination saved: ${data.get('city')}.`)
          }}
          onReset={() => setFeedback('Destination reset.')}
        >
          <Field
            label="Destination"
            description="Search for a city, then choose a result."
            required
          >
            <Combobox
              items={cityOptions}
              name="city"
              defaultValue="budapest"
            />
          </Field>
          <div className="flex flex-wrap gap-3">
            <Button type="submit">Save destination</Button>
            <Button
              type="reset"
              variant="outline"
              tone="neutral"
            >
              Reset
            </Button>
          </div>
          <output>{feedback}</output>
        </form>
      </CardContent>
    </Card>
  )
}

/** The application owns request timing, cancellation, response ordering and the selected label. */
export function ComboboxAsyncExample() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<ComboboxOption | undefined>(cityOptions[2])
  const [result, setResult] = useState<{
    query: string
    items: ComboboxOption[]
    loading: boolean
    error?: string
  }>({ query: '', items: [], loading: true })
  useEffect(() => {
    // The delayed lookup stands in for fetch; cleanup prevents stale results from winning.
    let current = true

    const timer = setTimeout(() => {
      if (!current) return
      if (query.toLowerCase() === 'error')
        setResult({
          query,
          items: [],
          loading: false,
          error: 'Cities could not be loaded. Change your search to try again.'
        })
      else
        setResult({
          query,
          items: cityOptions.filter(item =>
            String(item.label).toLowerCase().includes(query.toLowerCase())
          ),
          loading: false
        })
    }, 650)
    return () => {
      current = false
      clearTimeout(timer)
    }
  }, [query])
  return (
    <div className="grid w-80 max-w-full gap-4">
      <Field
        label="City"
        description="Search remote results. Try “error” to see a failed request."
      >
        <Combobox
          items={result.items}
          filter={null}
          query={query}
          onQueryChange={setQuery}
          value={selected?.value ?? null}
          selectedItem={selected}
          onValueChange={next =>
            setSelected(next === null ? undefined : result.items.find(item => item.value === next))
          }
          loading={result.loading || result.query !== query}
          errorText={result.query === query ? result.error : undefined}
        />
      </Field>
      <p>Selected: {selected?.label ?? 'None'}</p>
    </div>
  )
}

export function ComboboxControlledExample() {
  const [value, setValue] = useState<string | null>('oslo')
  return (
    <div className="grid w-80 max-w-full gap-4">
      <Field label="City">
        <Combobox
          items={cityOptions}
          value={value}
          onValueChange={setValue}
        />
      </Field>
      <output>Selected: {value ?? 'none'}</output>
      <Button
        variant="ghost"
        onClick={() => setValue(null)}
      >
        Clear selection
      </Button>
    </div>
  )
}

export function ComboboxMultipleExample() {
  const [feedback, setFeedback] = useState('')
  return (
    <form
      className="grid w-80 max-w-full gap-4"
      onSubmit={event => {
        event.preventDefault()
        const cities = new FormData(event.currentTarget).getAll('cities')
        setFeedback(`Shortlist: ${cities.join(', ') || 'none'}.`)
      }}
    >
      <Field
        label="Shortlisted cities"
        description="Choose every city the team would consider."
      >
        <Combobox
          type="multiple"
          items={cityOptions}
          name="cities"
          defaultValue={['oslo', 'rome']}
        />
      </Field>
      <Button type="submit">Save shortlist</Button>
      <output>{feedback}</output>
    </form>
  )
}

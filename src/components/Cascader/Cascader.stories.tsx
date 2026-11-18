import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../Button/Button.js'
import { Field } from '../Field/Field.js'
import { LocaleProvider } from '../LocaleProvider/LocaleProvider.js'
import type { TreeItem } from '../Tree/treeModel.js'
import { Cascader } from './Cascader.js'

const destinations: readonly TreeItem[] = [
  {
    value: 'canada',
    label: 'Canada',
    children: [
      {
        value: 'british-columbia',
        label: 'British Columbia',
        children: [
          { value: 'vancouver', label: 'Vancouver' },
          { value: 'victoria', label: 'Victoria' }
        ]
      },
      {
        value: 'ontario',
        label: 'Ontario',
        children: [
          { value: 'ottawa', label: 'Ottawa' },
          { value: 'toronto', label: 'Toronto' }
        ]
      }
    ]
  },
  {
    value: 'japan',
    label: 'Japan',
    children: [
      {
        value: 'kansai',
        label: 'Kansai',
        children: [
          { value: 'kyoto', label: 'Kyoto' },
          { value: 'osaka', label: 'Osaka' }
        ]
      }
    ]
  }
]
const destinationLabels = ['Country', 'Region', 'City']

const meta = {
  title: 'Components/Cascader',
  component: Cascader,
  args: {
    'aria-label': 'Shipping destination',
    items: destinations,
    columnLabels: destinationLabels,
    className: 'w-72 max-w-full'
  },
  parameters: {
    docs: {
      description: {
        component:
          'Pick a leaf through linked listboxes. Up and Down move within a column. The forward arrow opens the next level and the back arrow returns to the previous one. These directions reverse in RTL. Enter or Space chooses an option. Selected paths appear in the trigger, and forms submit the leaf key.'
      }
    }
  }
} satisfies Meta<typeof Cascader>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

function ShippingForm() {
  const [destination, setDestination] = useState('')
  return (
    <form
      className="grid w-full max-w-xs gap-3"
      onSubmit={event => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        setDestination(String(data.get('destination')))
      }}
      onReset={() => setDestination('')}
    >
      <Field
        label="Shipping destination"
        required
      >
        <Cascader
          name="destination"
          items={destinations}
          columnLabels={destinationLabels}
          placeholder="Choose a city"
        />
      </Field>
      <div className="flex gap-2">
        <Button type="submit">Confirm destination</Button>
        <Button
          type="reset"
          variant="outline"
        >
          Reset
        </Button>
      </div>
      <output className="text-sm">{destination && `Destination saved as ${destination}.`}</output>
    </form>
  )
}

export const WithField: Story = { render: () => <ShippingForm /> }

export const SharedControlSizes: Story = {
  render: () => (
    <div className="grid w-full max-w-xs gap-3">
      {(['small', 'medium', 'large'] as const).map(size => (
        <Field
          key={size}
          label={size[0].toUpperCase() + size.slice(1)}
        >
          <Cascader
            items={destinations}
            columnLabels={destinationLabels}
            controlSize={size}
            defaultValue="osaka"
          />
        </Field>
      ))}
    </div>
  )
}

function DeliveryQuote() {
  const [city, setCity] = useState<string | null>('toronto')
  return (
    <div className="grid w-full max-w-xs gap-3">
      <Field label="Delivery city">
        <Cascader
          items={destinations}
          columnLabels={destinationLabels}
          value={city}
          onValueChange={setCity}
        />
      </Field>
      <Button
        variant="outline"
        onClick={() => setCity(null)}
      >
        Clear destination
      </Button>
    </div>
  )
}
export const Controlled: Story = { render: () => <DeliveryQuote /> }

function loadLevel(items: readonly TreeItem[]): NonNullable<TreeItem['loadChildren']> {
  return signal =>
    new Promise(resolve => {
      const timer = setTimeout(() => resolve(items), 650)
      signal.addEventListener('abort', () => clearTimeout(timer), { once: true })
    })
}

const archives: readonly TreeItem[] = [
  {
    value: 'operations',
    label: 'Operations',
    loadChildren: loadLevel([
      {
        value: 'planning',
        label: 'Planning',
        loadChildren: loadLevel([
          { value: 'forecasts', label: 'Forecasts' },
          { value: 'schedules', label: 'Schedules' }
        ])
      }
    ])
  },
  {
    value: 'finance',
    label: 'Finance',
    loadChildren: loadLevel([
      {
        value: 'budgets',
        label: 'Budgets',
        loadChildren: loadLevel([
          { value: 'approved', label: 'Approved' },
          { value: 'drafts', label: 'Drafts' }
        ])
      }
    ])
  }
]

export const FindAnArchivedDocument: Story = {
  args: {
    'aria-label': 'Document folder',
    items: archives,
    columnLabels: ['Team', 'Collection', 'Folder'],
    placeholder: 'Choose a folder',
    loadingText: 'Fetching folders…',
    emptyText: 'There are no folders in this collection.'
  }
}

const hebrewDestinations: readonly TreeItem[] = [
  {
    value: 'il',
    label: 'ישראל',
    children: [
      {
        value: 'center',
        label: 'מחוז המרכז',
        children: [
          { value: 'raanana', label: 'רעננה' },
          { value: 'rehovot', label: 'רחובות' }
        ]
      }
    ]
  }
]

export const ChooseADestinationInHebrew: Story = {
  render: () => (
    <LocaleProvider locale="he-IL">
      <Field
        label="יעד משלוח"
        className="w-72 max-w-full"
      >
        <Cascader
          items={hebrewDestinations}
          columnLabels={['מדינה', 'מחוז', 'עיר']}
        />
      </Field>
    </LocaleProvider>
  )
}

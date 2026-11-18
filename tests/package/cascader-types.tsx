import { Cascader, type CascaderProps, type TreeItem } from '@cognitap/radiant'

const items: readonly TreeItem[] = [
  {
    value: 'country',
    label: 'Country',
    loadChildren: async signal => (signal.aborted ? [] : [{ value: 'city', label: 'City' }])
  }
]

export const destination = (
  <Cascader
    aria-label="Destination"
    items={items}
    value="city"
    onValueChange={value => value?.toUpperCase()}
    name="destination"
    columnLabels={['Country', 'City']}
  />
)

// @ts-expect-error The consumer owns either value or defaultValue.
export const ambiguous: CascaderProps = { items, value: 'city', defaultValue: 'city' }

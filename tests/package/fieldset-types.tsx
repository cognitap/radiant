import { createElement as h, createRef } from 'react'
import { Fieldset, Field, Input } from '@cognitap/radiant'
h(
  Fieldset,
  {
    legend: 'Shipping',
    ref: createRef<HTMLFieldSetElement>(),
    disabled: true,
    form: 'checkout',
    name: 'shipping',
    style: { '--rad-fieldset-gap': '1rem' },
    parts: { legend: { className: 'italic' }, error: { style: { color: 'red' } } }
  },
  h(Field, { label: 'Street' }, h(Input, { name: 'street' }))
)
// @ts-expect-error Groups need a legend.
h(Fieldset, { children: 'Fields' })
// @ts-expect-error Individual Fields own required controls.
h(Fieldset, { legend: 'Shipping', required: true })
// @ts-expect-error The native fieldset host is fixed.
h(Fieldset, { legend: 'Shipping', layout: 'control' })
// @ts-expect-error Part hooks cannot replace group relationship IDs.
h(Fieldset, { legend: 'Shipping', parts: { legend: { id: 'other' } } })

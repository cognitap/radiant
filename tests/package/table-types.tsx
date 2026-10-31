import { createElement as h, createRef } from 'react'
import {
  Table,
  TableCaption,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  TableContainer
} from '@cognitap/radiant'
h(
  TableContainer,
  { 'aria-label': 'Scrollable members', ref: createRef<HTMLElement>() },
  h(
    Table,
    { ref: createRef<HTMLTableElement>(), style: { '--rad-table-padding-inline': '1rem' } },
    h(TableCaption, {}, 'Members'),
    h(TableHead, {}, h(TableRow, {}, h(TableHeader, { scope: 'col', id: 'name' }, 'Name'))),
    h(TableBody, {}, h(TableRow, {}, h(TableCell, { headers: 'name' }, 'Jordan')))
  )
)
h(TableHeader, { scope: 'row', ref: createRef<HTMLTableCellElement>() }, 'Jordan')
h(TableContainer, { 'aria-labelledby': 'members-heading' })
// @ts-expect-error Scroll regions require a name.
h(TableContainer, {})
h(TableContainer, { 'aria-label': 'A', 'aria-labelledby': 'B' })
// @ts-expect-error Table retains native table semantics.
h(Table, { role: 'grid' })

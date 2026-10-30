import { createElement as h, createRef } from 'react'
import {
  Pagination,
  PaginationList,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationButton,
  type PaginationLinkRenderProps
} from '@cognitap/radiant'
h(
  Pagination,
  { ref: createRef<HTMLElement>(), style: { '--rad-pagination-gap': '1rem' } },
  h(
    PaginationList,
    {},
    h(
      PaginationItem,
      {},
      h(
        PaginationLink,
        {
          href: '/two',
          current: true,
          ref: createRef<HTMLAnchorElement>(),
          render: (p: PaginationLinkRenderProps) => h('a', p)
        },
        '2'
      )
    )
  )
)
h(PaginationPrevious, { href: '/one', download: true })
h(
  PaginationButton,
  { disabled: true, current: true, ref: createRef<HTMLButtonElement>() },
  'Page 2'
)
// @ts-expect-error Navigation requires a real URL.
h(PaginationLink, { children: '2' })
// @ts-expect-error Current page is owned by current.
h(PaginationButton, { 'aria-current': 'step' })
// @ts-expect-error Navigation has no fake disabled state.
h(PaginationLink, { href: '/two', disabled: true })

import { createElement as h, createRef } from 'react'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  type BreadcrumbLinkRenderProps
} from '@cognitap/radiant'
h(
  Breadcrumb,
  {
    ref: createRef<HTMLElement>(),
    'aria-label': 'Project location',
    style: { '--rad-breadcrumb-gap': '1rem' }
  },
  h(
    BreadcrumbList,
    { ref: createRef<HTMLOListElement>() },
    h(
      BreadcrumbItem,
      {},
      h(
        BreadcrumbLink,
        {
          href: '/projects',
          ref: createRef<HTMLAnchorElement>(),
          render: (props: BreadcrumbLinkRenderProps) => h('a', props)
        },
        'Projects'
      ),
      h(BreadcrumbSeparator, {}, '/')
    ),
    h(BreadcrumbItem, {}, h(BreadcrumbPage, {}, 'Current'))
  )
)
// @ts-expect-error Navigation links require destinations.
h(BreadcrumbLink, { children: 'Projects' })
// @ts-expect-error Use current rather than conflicting ARIA.
h(BreadcrumbLink, { href: '/projects', 'aria-current': 'step' })

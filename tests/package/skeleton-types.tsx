import { createElement as h, createRef } from 'react'
import { Skeleton, type SkeletonProps } from '@cognitap/radiant'
h(Skeleton, {
  ref: createRef<HTMLSpanElement>(),
  motion: 'off',
  style: { '--rad-skeleton-height': '2rem', width: '65%', borderRadius: '.25rem' }
})
// @ts-expect-error Placeholder shapes cannot become live status regions.
const live: SkeletonProps = { 'aria-live': 'polite' }
// @ts-expect-error The application owns busy state on its content region.
const busy: SkeletonProps = { 'aria-busy': true }
// @ts-expect-error Placeholder shapes are always decorative.
const name: SkeletonProps = { 'aria-label': 'Loading' }
// @ts-expect-error Skeleton never contains content or controls.
const children: SkeletonProps = { children: 'Account details' }
void [live, busy, name, children]

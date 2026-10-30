import { createRef } from 'react'
import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateTitle,
  EmptyStateDescription,
  EmptyStateActions,
  Button,
  type EmptyStateProps,
  type EmptyStateIconProps,
  type EmptyStateTitleProps,
  type HeadingLevel,
  type CardHeadingLevel,
  type AlertHeadingLevel
} from '@cognitap/radiant'
export const example = (
  <EmptyState
    variant="first-use"
    tone="neutral"
    ref={createRef<HTMLDivElement>()}
    style={{ '--rad-empty-state-gap': '2rem' }}
  >
    <EmptyStateIcon ref={createRef<HTMLSpanElement>()}>
      <svg />
    </EmptyStateIcon>
    <EmptyStateTitle
      level={3}
      ref={createRef<HTMLHeadingElement>()}
    >
      No projects
    </EmptyStateTitle>
    <EmptyStateDescription>Create a project.</EmptyStateDescription>
    <EmptyStateActions>
      <Button>Create</Button>
    </EmptyStateActions>
  </EmptyState>
)
export const heading: HeadingLevel = 4
export const card: CardHeadingLevel = heading
export const alert: AlertHeadingLevel = heading
// @ts-expect-error Content state is one of the documented treatments.
export const invalid: EmptyStateProps = { variant: 'loading' }
// @ts-expect-error The passive root owns no open state.
export const open: EmptyStateProps = { open: true }
// @ts-expect-error Native heading levels run from 1 to 6.
export const wrongLevel: EmptyStateTitleProps = { level: 7 }
// @ts-expect-error The icon is decorative.
export const namedIcon: EmptyStateIconProps = { 'aria-label': 'Important' }
// @ts-expect-error The icon is not a keyboard stop.
export const focusableIcon: EmptyStateIconProps = { tabIndex: 0 }

import { Spoiler, type SpoilerProps } from '@cognitap/radiant'

export const notes = (
  <Spoiler
    maxHeight={80}
    open={false}
    onOpenChange={open => Boolean(open)}
    showMoreLabel="Read notes"
  >
    Release notes for workspace owners.
  </Spoiler>
)
// @ts-expect-error Spoiler has a single open state owner.
export const ambiguous: SpoilerProps = { open: false, defaultOpen: true }

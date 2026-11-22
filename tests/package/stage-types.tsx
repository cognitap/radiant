import { createRef } from 'react'
import {
  Stage,
  StageActions,
  StageBody,
  StageDescription,
  StageExpand,
  StageFooter,
  StageHeader,
  StageTitle,
  type StageBodyProps,
  type StageExpandProps,
  type StageHeadingLevel,
  type StageProps
} from '@cognitap/radiant'
const level: StageHeadingLevel = 3
const props: StageProps = {
  padding: 'airy',
  ref: createRef<HTMLDivElement>(),
  style: { '--rad-stage-padding': '1rem' }
}
const body: StageBodyProps = { aspectRatio: 16 / 9, 'aria-busy': true }
;<Stage {...props}>
  <StageHeader>
    <StageTitle level={level}>Widget</StageTitle>
    <StageDescription>Summary</StageDescription>
    <StageActions>
      <button type="button">Act</button>
    </StageActions>
  </StageHeader>
  <StageBody {...body}>Content</StageBody>
  <StageFooter />
</Stage>
// @ts-expect-error Padding is a theme spacing step.
;<Stage padding="1rem" />
// @ts-expect-error The aspect ratio is a number.
;<StageBody aspectRatio="16 / 9" />
// @ts-expect-error Heading levels run from 1 to 6.
;<StageTitle level={7} />
const expand: StageExpandProps = {
  expandLabel: 'Expand',
  collapseLabel: 'Collapse',
  variant: 'ghost'
}
;<Stage
  expandTo="panel"
  side="start"
  defaultOpen
  onOpenChange={(open: boolean) => open}
>
  <StageExpand {...expand} />
</Stage>
// @ts-expect-error StageExpand needs both labels.
;<StageExpand expandLabel="Expand" />
// @ts-expect-error Open state has one owner.
;<Stage
  expandTo="dialog"
  open
  defaultOpen
/>
// @ts-expect-error Stages expand to a dialog or a panel.
;<Stage expandTo="sheet" />

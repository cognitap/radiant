import { createRef } from 'react'
import {
  Stage,
  StageActions,
  StageBody,
  StageDescription,
  StageFooter,
  StageHeader,
  StageTitle,
  type StageBodyProps,
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

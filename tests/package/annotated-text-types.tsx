import { createRef } from 'react'
import {
  AnnotatedText,
  type AnnotatedTextArc,
  type AnnotatedTextArcText,
  type AnnotatedTextProps,
  type AnnotatedTextSpan,
  type AnnotatedTextToken
} from '@cognitap/radiant'
const tokens: AnnotatedTextToken[] = [{ text: 'retry', labels: ['call'] }, { text: 'attempts' }]
const spans: AnnotatedTextSpan[] = [{ start: 0, end: 1, label: 'Call', series: 2 }]
const arcText: AnnotatedTextArcText = ({ from, to, label }) => `${label} ${from} ${to}`
const arcs: AnnotatedTextArc[] = [
  { from: 1, to: 0, label: 'passed to', series: 2 },
  { from: 0, to: 1 }
]
const props: AnnotatedTextProps = {
  'aria-label': 'Review',
  tokens,
  spans,
  arcs,
  arcText,
  ref: createRef<HTMLDivElement>(),
  style: { '--rad-annotated-text-gap': '1rem' }
}
;<AnnotatedText {...props} />
;<AnnotatedText
  aria-labelledby="heading"
  tokens={tokens}
/>
// @ts-expect-error An accessible name is required.
;<AnnotatedText tokens={tokens} />
// @ts-expect-error Series run from 1 to 8.
const outOfRange: AnnotatedTextSpan = { start: 0, end: 0, label: 'x', series: 9 }
// @ts-expect-error A span needs a label.
const unlabelled: AnnotatedTextSpan = { start: 0, end: 0, series: 1 }
void [outOfRange, unlabelled]
// @ts-expect-error The host renders its own content.
;<AnnotatedText
  aria-label="x"
  tokens={tokens}
>
  child
</AnnotatedText>

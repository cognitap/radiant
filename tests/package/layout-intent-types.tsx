import { createRef } from 'react'
import {
  Compare,
  CompareItem,
  CompareItemBody,
  CompareItemFooter,
  CompareItemHeader,
  Grid,
  Reveal,
  Split,
  SplitMain,
  SplitSecondary,
  type GridColumns,
  type RevealItem,
  type SplitProps,
  type SplitRatio,
  type SplitSide
} from '@cognitap/radiant'
const side: SplitSide = 'start'
const ratio: SplitRatio = 'balanced'
const split: SplitProps = { side, ratio, gap: 'airy', ref: createRef<HTMLDivElement>() }
;<Split {...split}>
  <SplitMain>Main</SplitMain>
  <SplitSecondary>Aside</SplitSecondary>
</Split>
const columns: GridColumns = 6
;<Grid
  maxColumns={columns}
  gap="tight"
/>
;<Compare ref={createRef<HTMLUListElement>()}>
  <CompareItem>
    <CompareItemHeader>Basic</CompareItemHeader>
    <CompareItemBody>One learner.</CompareItemBody>
    <CompareItemFooter>Choose</CompareItemFooter>
  </CompareItem>
</Compare>
const items: readonly RevealItem[] = [{ value: 'one', children: 'One' }]
;<Reveal
  items={items}
  defaultValue="one"
  onValueChange={(value: string) => value}
  previousLabel="Back"
  nextLabel="Next"
  positionLabel={(index, count) => `${index + 1}/${count}`}
/>
// @ts-expect-error Split takes a ratio intent, not a width.
;<Split ratio="240px" />
// @ts-expect-error The secondary side is logical.
;<Split side="left" />
// @ts-expect-error Grid shows at most six columns.
;<Grid maxColumns={7} />
// @ts-expect-error Column caps are whole numbers.
;<Grid maxColumns="3" />
// @ts-expect-error Reveal has no English fallback for its labels.
;<Reveal
  items={items}
  positionLabel={() => ''}
/>

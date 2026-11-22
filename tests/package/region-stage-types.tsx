import { createRef } from 'react'
import {
  RegionStage,
  RegionStageControls,
  RegionStagePin,
  RegionStageRegion,
  RegionStageViewport,
  type RegionStageProps,
  type RegionStageSeries
} from '@cognitap/radiant'
const series: RegionStageSeries = 3
const single: RegionStageProps = {
  'aria-label': 'Plan',
  value: null,
  onValueChange: (next: string | null) => void next,
  ref: createRef<HTMLDivElement>(),
  style: { '--rad-region-stage-gap': '1rem' }
}
;<RegionStage {...single} />
;<RegionStage
  aria-labelledby="title"
  type="multiple"
  defaultValue={['a']}
  onValueChange={(next: string[]) => void next}
  maxZoom={4}
>
  <RegionStageControls
    zoomInLabel="In"
    zoomOutLabel="Out"
    zoomResetLabel="Reset"
  />
  <RegionStageViewport viewBox="0 0 10 10">
    <RegionStageRegion
      value="a"
      aria-label="A"
      series={series}
      d="M0 0h5v5H0z"
    />
    <RegionStagePin
      x={1}
      y={2}
      aria-label="Pin"
      defaultOpen
    >
      Callout
    </RegionStagePin>
  </RegionStageViewport>
</RegionStage>
// @ts-expect-error Multiple selection takes a list.
;<RegionStage
  aria-label="Plan"
  type="multiple"
  value="a"
/>
// @ts-expect-error Regions need a name.
;<RegionStageRegion
  value="a"
  d="M0 0"
/>
// @ts-expect-error The controls have no default text.
;<RegionStageControls
  zoomInLabel="In"
  zoomOutLabel="Out"
/>

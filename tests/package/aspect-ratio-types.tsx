import { createRef } from 'react'
import { AspectRatio, type AspectRatioProps } from '@cognitap/radiant'
const props: AspectRatioProps = {
  ratio: 4 / 3,
  ref: createRef<HTMLDivElement>(),
  style: { '--rad-surface-radius': '12px' },
  onClick: event => event.currentTarget.focus()
}
;<AspectRatio {...props}>
  <img
    alt="Mountains"
    src="/mountains.jpg"
  />
</AspectRatio>
// @ts-expect-error Ratio is a numeric width divided by height.
;<AspectRatio ratio="16 / 9" />
// @ts-expect-error The root is a native div.
;<AspectRatio ref={createRef<SVGSVGElement>()} />

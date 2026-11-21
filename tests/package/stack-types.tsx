import { createRef } from 'react'
import { Stack, type StackAlign, type StackJustify, type StackProps } from '@cognitap/radiant'
const align: StackAlign = 'center'
const justify: StackJustify = 'evenly'
const props: StackProps = {
  orientation: 'horizontal',
  gap: 'tight',
  align,
  justify,
  wrap: true,
  ref: createRef<HTMLDivElement>(),
  style: { '--rad-spacing-tight': '4px' },
  onClick: event => event.currentTarget.focus()
}
;<Stack {...props}>
  <span>Item</span>
</Stack>
// @ts-expect-error Direction is horizontal or vertical.
;<Stack orientation="row" />
// @ts-expect-error Gap is a theme spacing step, not a length.
;<Stack gap="1rem" />
// @ts-expect-error Gap is a theme spacing step, not a number.
;<Stack gap={8} />
// @ts-expect-error Align is a logical cross-axis value.
;<Stack align="flex-start" />
// @ts-expect-error Justify uses short names.
;<Stack justify="space-between" />
// @ts-expect-error The root is a native div.
;<Stack ref={createRef<HTMLUListElement>()} />

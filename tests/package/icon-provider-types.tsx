import {
  ICON_NAMES,
  IconProvider,
  type IconComponent,
  type IconName,
  type IconSet
} from '@cognitap/radiant'
import type { A2uiIconComponent } from '@cognitap/radiant/a2ui'

const Mark: IconComponent = ({ className }) => <svg className={className} />
const shared: A2uiIconComponent = Mark
const names: readonly IconName[] = ICON_NAMES
export const icons: IconSet = { check: Mark, close: shared, [names[0]!]: Mark }
export const tree = <IconProvider icons={icons}>Content</IconProvider>
// @ts-expect-error Only the standard icon names are accepted.
export const unknown: IconSet = { star: Mark }
// @ts-expect-error Icons receive only className and aria-hidden.
export const sized: IconComponent = ({ size }: { size: number }) => <svg width={size} />

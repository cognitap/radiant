import { CopyButton, type CopyButtonRenderProps } from '@cognitap/radiant'

export const reference = (
  <CopyButton
    value="INV-004"
    resetDelay={1000}
    parts={{ status: { className: 'text-xs' } }}
    render={(props: CopyButtonRenderProps) => <button {...props} />}
  >
    Copy invoice ID
  </CopyButton>
)

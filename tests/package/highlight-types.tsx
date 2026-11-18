import { Highlight, type HighlightProps } from '@cognitap/radiant'

const props: HighlightProps = {
  text: 'Café near the office',
  query: 'cafe',
  ignoreDiacritics: true,
  parts: { mark: { className: 'font-semibold' } }
}
export const result = <Highlight {...props} />

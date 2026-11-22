import { A2UI_BASIC_CATALOG_ID, A2UI_PROTOCOL_VERSION } from './catalogGenerator.js'
import type { A2uiMessage } from './sanitize.js'

export const MEDIA_SURFACE_ID = 'field_notes'

const surface = (components: readonly Record<string, unknown>[]): readonly A2uiMessage[] => [
  {
    version: A2UI_PROTOCOL_VERSION,
    createSurface: { surfaceId: MEDIA_SURFACE_ID, catalogId: A2UI_BASIC_CATALOG_ID, components }
  }
]

const svgDataUrl = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`

export const MEDIA_IMAGE_URL = svgDataUrl(
  '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="#4f7cac"/><circle cx="240" cy="60" r="28" fill="#f4d35e"/></svg>'
)
export const MEDIA_VIDEO_URL = 'data:video/mp4;base64,'
export const MEDIA_AUDIO_URL = 'data:audio/mpeg;base64,'

/** A mono 8-bit PCM WAV tone as a data URL, so audio stories and tests need no network. */
export function toneDataUrl(seconds: number, rate = 8000): string {
  const samples = Math.round(seconds * rate)
  const bytes = new Uint8Array(44 + samples)
  const view = new DataView(bytes.buffer)
  const text = (offset: number, value: string) =>
    [...value].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)))
  text(0, 'RIFF')
  view.setUint32(4, 36 + samples, true)
  text(8, 'WAVE')
  text(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, rate, true)
  view.setUint32(28, rate, true)
  view.setUint16(32, 1, true)
  view.setUint16(34, 8, true)
  text(36, 'data')
  view.setUint32(40, samples, true)
  for (let i = 0; i < samples; i++)
    bytes[44 + i] = 128 + Math.round(24 * Math.sin((2 * Math.PI * 440 * i) / rate))
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return `data:audio/wav;base64,${btoa(binary)}`
}

/** Decorative, labelled, and SVG-path icons, plus one icon-only button named by its icon. */
export const iconFixtureMessages = surface([
  {
    id: 'root',
    component: 'Column',
    children: ['heading_text', 'decorative_icon', 'warning_icon', 'path_icon', 'search_button']
  },
  { id: 'heading_text', component: 'Text', text: 'Field notes' },
  { id: 'decorative_icon', component: 'Icon', name: 'star' },
  { id: 'warning_icon', component: 'Icon', name: 'warning', accessibility: { label: 'Warning' } },
  {
    id: 'path_icon',
    component: 'Icon',
    name: { svgPath: 'M12 2 22 22H2Z' },
    accessibility: { label: 'Summit' }
  },
  {
    id: 'search_button',
    component: 'Button',
    child: 'search_icon',
    action: { event: { name: 'search_notes' } }
  },
  { id: 'search_icon', component: 'Icon', name: 'search', accessibility: { label: 'Search' } }
])

/** A described image and a decorative one. */
export const imageFixtureMessages = surface([
  { id: 'root', component: 'Column', children: ['lake_image', 'divider_image'] },
  {
    id: 'lake_image',
    component: 'Image',
    url: MEDIA_IMAGE_URL,
    description: 'A blue lake under a yellow sun',
    fit: 'cover',
    variant: 'largeFeature'
  },
  {
    id: 'divider_image',
    component: 'Image',
    url: MEDIA_IMAGE_URL,
    description: '',
    variant: 'icon'
  }
])

/** A named video with a poster frame. */
export const videoFixtureMessages = surface([
  { id: 'root', component: 'Column', children: ['tour_video'] },
  {
    id: 'tour_video',
    component: 'Video',
    url: MEDIA_VIDEO_URL,
    posterUrl: MEDIA_IMAGE_URL,
    accessibility: { label: 'Lake tour' }
  }
])

/** An audio clip described by its visible caption. */
export const audioPlayerFixtureMessages = surface([
  { id: 'root', component: 'Column', children: ['birdsong_audio'] },
  {
    id: 'birdsong_audio',
    component: 'AudioPlayer',
    url: MEDIA_AUDIO_URL,
    description: 'Morning birdsong at the lake'
  }
])

/** Media without names or alt text, for accessibility validation. */
export const inaccessibleMediaFixtureMessages = surface([
  {
    id: 'root',
    component: 'Column',
    children: ['unnamed_image', 'unnamed_video', 'unnamed_audio', 'icon_button']
  },
  { id: 'unnamed_image', component: 'Image', url: MEDIA_IMAGE_URL },
  { id: 'unnamed_video', component: 'Video', url: MEDIA_VIDEO_URL },
  { id: 'unnamed_audio', component: 'AudioPlayer', url: MEDIA_AUDIO_URL },
  {
    id: 'icon_button',
    component: 'Button',
    child: 'icon_button_icon',
    action: { event: { name: 'close' } }
  },
  { id: 'icon_button_icon', component: 'Icon', name: 'close' }
])

import { expect, test, vi } from 'vitest'
import { A2uiMediaProvider, A2uiSurface, type CatalogDiagnostic } from '../../src/a2ui/index.js'
import { lucideA2uiIcons } from '../../src/a2ui/lucide.js'
import {
  audioPlayerFixtureMessages,
  iconFixtureMessages,
  imageFixtureMessages,
  MEDIA_AUDIO_URL,
  MEDIA_IMAGE_URL,
  MEDIA_SURFACE_ID,
  MEDIA_VIDEO_URL,
  videoFixtureMessages
} from '../../src/a2ui/mediaFixtures.js'
import { A2UI_BASIC_CATALOG_ID, A2UI_PROTOCOL_VERSION } from '../../src/a2ui/catalogGenerator.js'
import { mount } from './familyHarness.js'

const surfaceOf = (components: readonly Record<string, unknown>[]) => [
  {
    version: A2UI_PROTOCOL_VERSION,
    createSurface: { surfaceId: MEDIA_SURFACE_ID, catalogId: A2UI_BASIC_CATALOG_ID, components }
  }
]
const column = (...ids: string[]) => ({ id: 'root', component: 'Column', children: ids })
const NON_SQUARE_URL = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100"><rect width="300" height="100" fill="#4f7cac"/></svg>'
)}`

test('renders mapped icons hidden when decorative and named when labelled', async () => {
  const { host } = await mount(
    <A2uiMediaProvider icons={lucideA2uiIcons}>
      <A2uiSurface
        surfaceId={MEDIA_SURFACE_ID}
        messages={iconFixtureMessages}
      />
    </A2uiMediaProvider>,
    true
  )
  const icons = [...host.querySelectorAll<HTMLElement>('[data-slot="a2ui-icon"]')]
  expect(icons).toHaveLength(4)
  const [decorative, warning, path, search] = icons
  expect(decorative!.getAttribute('aria-hidden')).toBe('true')
  expect(decorative!.hasAttribute('role')).toBe(false)
  expect(decorative!.querySelector('svg')).not.toBeNull()
  for (const [icon, name] of [
    [warning, 'Warning'],
    [path, 'Summit'],
    [search, 'Search']
  ] as const) {
    expect(icon!.getAttribute('role')).toBe('img')
    expect(icon!.getAttribute('aria-label')).toBe(name)
    expect(icon!.hasAttribute('aria-hidden')).toBe(false)
    expect(icon!.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true')
  }
  expect(path!.querySelector('path')!.getAttribute('d')).toBe('M12 2 22 22H2Z')
  expect(search!.closest('button')).not.toBeNull()
  expect(decorative!.getBoundingClientRect().width).toBeGreaterThan(0)
})

test('unknown and unmapped icon names render nothing and report one diagnostic each', async () => {
  const diagnostics: CatalogDiagnostic[] = []
  const { host } = await mount(
    <>
      <A2uiMediaProvider icons={{ star: lucideA2uiIcons.star }}>
        <A2uiSurface
          surfaceId={MEDIA_SURFACE_ID}
          messages={[
            {
              version: A2UI_PROTOCOL_VERSION,
              createSurface: {
                surfaceId: MEDIA_SURFACE_ID,
                catalogId: A2UI_BASIC_CATALOG_ID,
                components: [
                  {
                    id: 'root',
                    component: 'Column',
                    children: ['known', 'unknown', 'unmapped', 'after']
                  },
                  { id: 'known', component: 'Icon', name: 'star' },
                  { id: 'unknown', component: 'Icon', name: 'rocket' },
                  { id: 'unmapped', component: 'Icon', name: 'search' },
                  { id: 'after', component: 'Text', text: 'Still here' }
                ]
              }
            }
          ]}
          onDiagnostic={d => diagnostics.push(d)}
        />
      </A2uiMediaProvider>
    </>
  )
  const icons = [...host.querySelectorAll<HTMLElement>('[data-slot="a2ui-icon"]')]
  expect(icons.map(icon => icon.hidden)).toEqual([false, true, true])
  expect(icons.filter(icon => icon.hidden).every(icon => icon.childElementCount === 0)).toBe(true)
  expect(host.textContent).toContain('Still here')
  // Off-catalog names are reported during coercion; catalog names the map lacks, after render.
  expect(diagnostics).toEqual([
    {
      kind: 'fallback',
      nodeId: 'unmapped',
      component: 'Icon',
      prop: 'name',
      received: 'search',
      used: null,
      reason: 'No icon is provided for this name.',
      code: 'UNKNOWN_ICON'
    },
    {
      kind: 'fallback',
      nodeId: 'unknown',
      component: 'Icon',
      prop: 'name',
      received: 'rocket',
      used: null,
      reason: 'No icon is provided for this name.',
      code: 'UNKNOWN_ICON'
    }
  ])
})

test('renders images as native img elements with alt text or empty alt when decorative', async () => {
  const { host } = await mount(
    <A2uiSurface
      surfaceId={MEDIA_SURFACE_ID}
      messages={imageFixtureMessages}
    />,
    true
  )
  const [lake, divider] = [
    ...host.querySelectorAll<HTMLImageElement>('img[data-slot="a2ui-image"]')
  ]
  expect(lake!.getAttribute('src')).toBe(MEDIA_IMAGE_URL)
  expect(lake!.alt).toBe('A blue lake under a yellow sun')
  expect(lake!.className).toContain('object-cover')
  expect(divider!.getAttribute('alt')).toBe('')
  expect(divider!.className).toContain('size-6')
  await expect.poll(() => lake!.complete && lake!.naturalWidth).toBe(320)
})

test('renders video and audio as native elements with native controls and names', async () => {
  const { host } = await mount(
    <>
      <A2uiSurface
        surfaceId={MEDIA_SURFACE_ID}
        messages={videoFixtureMessages}
      />
      <A2uiSurface
        surfaceId={`${MEDIA_SURFACE_ID}_audio`}
        messages={audioPlayerFixtureMessages.map(m => ({
          ...m,
          createSurface: {
            ...(m.createSurface as object),
            surfaceId: `${MEDIA_SURFACE_ID}_audio`
          }
        }))}
      />
    </>,
    true
  )
  const video = host.querySelector<HTMLVideoElement>('video[data-slot="a2ui-video"]')!
  expect(video.controls).toBe(true)
  expect(video.getAttribute('src')).toBe(MEDIA_VIDEO_URL)
  expect(video.getAttribute('poster')).toBe(MEDIA_IMAGE_URL)
  expect(video.getAttribute('aria-label')).toBe('Lake tour')

  const figure = host.querySelector<HTMLElement>('figure[data-slot="a2ui-audio-player"]')!
  const audio = figure.querySelector('audio')!
  expect(audio.controls).toBe(true)
  expect(audio.getAttribute('src')).toBe(MEDIA_AUDIO_URL)
  const caption = figure.querySelector('figcaption')!
  expect(caption.textContent).toBe('Morning birdsong at the lake')
  expect(audio.hasAttribute('aria-label')).toBe(false)
  expect(audio.getAttribute('aria-labelledby')).toBe(caption.id)
})

test('drops unsafe or policy-rejected media URLs, keeps the element, and reports each once', async () => {
  const diagnostics: CatalogDiagnostic[] = []
  const policy = vi.fn((url: string) => !url.includes('blocked.example'))
  const { host } = await mount(
    <A2uiMediaProvider urlPolicy={policy}>
      <A2uiSurface
        surfaceId={MEDIA_SURFACE_ID}
        messages={surfaceOf([
          column('script', 'blocked', 'relative', 'video', 'note'),
          { id: 'script', component: 'Image', url: 'javascript:alert(1)', description: 'x' },
          {
            id: 'blocked',
            component: 'Image',
            url: 'https://blocked.example/a.png',
            description: 'x'
          },
          { id: 'relative', component: 'Image', url: '/media/a.png', description: 'x' },
          {
            id: 'video',
            component: 'Video',
            url: MEDIA_VIDEO_URL,
            posterUrl: 'file:///etc/poster.png',
            accessibility: { label: 'Clip' }
          },
          { id: 'note', component: 'Text', text: 'Rendered' }
        ])}
        onDiagnostic={d => diagnostics.push(d)}
      />
    </A2uiMediaProvider>
  )
  const [script, blocked, relative] = [...host.querySelectorAll('img')]
  expect(script!.hasAttribute('src')).toBe(false)
  expect(blocked!.hasAttribute('src')).toBe(false)
  // Relative URLs resolve against the document base after mount.
  expect(relative!.getAttribute('src')).toBe('/media/a.png')
  expect(relative!.getAttribute('referrerpolicy')).toBe('no-referrer')
  expect(policy).toHaveBeenCalledWith(new URL('/media/a.png', document.baseURI).href, {
    component: 'Image',
    prop: 'url'
  })
  const video = host.querySelector('video')!
  expect(video.getAttribute('src')).toBe(MEDIA_VIDEO_URL)
  expect(video.hasAttribute('poster')).toBe(false)
  expect(host.textContent).toContain('Rendered')
  expect(
    diagnostics.map(({ nodeId, component, prop, received, code, kind }) => ({
      nodeId,
      component,
      prop,
      received,
      code,
      kind
    }))
  ).toEqual([
    {
      nodeId: 'script',
      component: 'Image',
      prop: 'url',
      received: 'javascript:alert(1)',
      code: 'UNSAFE_URL',
      kind: 'stripped'
    },
    {
      nodeId: 'blocked',
      component: 'Image',
      prop: 'url',
      received: 'https://blocked.example/a.png',
      code: 'UNSAFE_URL',
      kind: 'stripped'
    },
    {
      nodeId: 'video',
      component: 'Video',
      prop: 'posterUrl',
      received: 'file:///etc/poster.png',
      code: 'UNSAFE_URL',
      kind: 'stripped'
    }
  ])
})

test('fixed-size image variants stay square and apply object-fit', async () => {
  const { host } = await mount(
    <A2uiSurface
      surfaceId={MEDIA_SURFACE_ID}
      messages={surfaceOf([
        column('avatar', 'icon', 'wide'),
        {
          id: 'avatar',
          component: 'Image',
          url: NON_SQUARE_URL,
          description: 'A',
          variant: 'avatar',
          fit: 'cover'
        },
        {
          id: 'icon',
          component: 'Image',
          url: NON_SQUARE_URL,
          description: 'I',
          variant: 'icon',
          fit: 'contain'
        },
        {
          id: 'wide',
          component: 'Image',
          url: NON_SQUARE_URL,
          description: 'W',
          variant: 'smallFeature'
        }
      ])}
    />
  )
  const [avatar, icon, wide] = [...host.querySelectorAll('img')]
  await expect.poll(() => wide!.naturalWidth).toBe(300)
  const box = (el: Element) => el.getBoundingClientRect()
  expect(box(avatar!).width).toBe(box(avatar!).height)
  expect(box(avatar!).width).toBeGreaterThan(0)
  expect(getComputedStyle(avatar!).objectFit).toBe('cover')
  expect(box(icon!).width).toBe(box(icon!).height)
  expect(getComputedStyle(icon!).objectFit).toBe('contain')
  expect(box(wide!).width / box(wide!).height).toBeCloseTo(3, 1)
  expect(getComputedStyle(wide!).objectFit).toBe('fill')
})

test('icons honor accessibility.hidden and stay quiet until a map is provided', async () => {
  const diagnostics: CatalogDiagnostic[] = []
  const messages = surfaceOf([
    column('hidden', 'search', 'bound'),
    {
      id: 'hidden',
      component: 'Icon',
      name: 'star',
      accessibility: { label: 'Star', hidden: true }
    },
    { id: 'search', component: 'Icon', name: 'search' },
    { id: 'bound', component: 'Icon', name: { '@path': '/icon' } }
  ]).map(m => ({
    ...m,
    createSurface: { ...m.createSurface, dataModel: { icon: 42 } }
  }))
  const surface = (
    <A2uiSurface
      surfaceId={MEDIA_SURFACE_ID}
      messages={messages}
      onDiagnostic={d => diagnostics.push(d)}
    />
  )
  const view = await mount(<A2uiMediaProvider icons={{}}>{surface}</A2uiMediaProvider>)
  // An empty map reports no catalog names; a non-string bound name is always reported.
  expect(diagnostics.map(d => [d.nodeId, d.received, d.reason])).toEqual([
    ['bound', 42, 'Icon name is not a string.']
  ])
  await view.render(<A2uiMediaProvider icons={lucideA2uiIcons}>{surface}</A2uiMediaProvider>)
  const hidden = view.host.querySelector<HTMLElement>('[data-slot="a2ui-icon"]')!
  expect(hidden.getAttribute('aria-hidden')).toBe('true')
  expect(hidden.hasAttribute('role')).toBe(false)
  expect(hidden.hasAttribute('aria-label')).toBe(false)
  expect(diagnostics).toHaveLength(1)
})

test('malformed object icon names are replaced without rejecting the batch', async () => {
  const diagnostics: CatalogDiagnostic[] = []
  const { host } = await mount(
    <A2uiMediaProvider icons={lucideA2uiIcons}>
      <A2uiSurface
        surfaceId={MEDIA_SURFACE_ID}
        messages={surfaceOf([
          column('number', 'empty', 'foreign', 'extra', 'coerced', 'after'),
          { id: 'number', component: 'Icon', name: { svgPath: 5 } },
          { id: 'empty', component: 'Icon', name: {} },
          { id: 'foreign', component: 'Icon', name: { foo: 'x' } },
          { id: 'extra', component: 'Icon', name: { svgPath: 'M0 0', extra: 1 } },
          { id: 'coerced', component: 'Icon', name: { svgPath: true } },
          { id: 'after', component: 'Text', text: 'Still here' }
        ])}
        onDiagnostic={d => diagnostics.push(d)}
      />
    </A2uiMediaProvider>
  )
  expect(host.textContent).toContain('Still here')
  expect(diagnostics.filter(d => d.kind === 'error')).toEqual([])
  expect(diagnostics.map(d => [d.nodeId, d.kind, d.used])).toEqual([
    ['number', 'coerced', { svgPath: '5' }],
    ['empty', 'coerced', { svgPath: '' }],
    ['foreign', 'coerced', { svgPath: '' }],
    ['extra', 'coerced', { svgPath: '' }],
    ['coerced', 'coerced', { svgPath: 'true' }]
  ])
  expect(host.querySelector('[data-node-id], [data-slot="a2ui-fallback"]')).toBeNull()
})

test('a bound icon name follows the data model', async () => {
  const { host } = await mount(
    <A2uiMediaProvider icons={lucideA2uiIcons}>
      <A2uiSurface
        surfaceId={MEDIA_SURFACE_ID}
        messages={[
          {
            version: A2UI_PROTOCOL_VERSION,
            createSurface: {
              surfaceId: MEDIA_SURFACE_ID,
              catalogId: A2UI_BASIC_CATALOG_ID,
              dataModel: { icon: 'star' },
              components: [
                column('bound'),
                {
                  id: 'bound',
                  component: 'Icon',
                  name: { '@path': '/icon' },
                  accessibility: { label: 'Favorite' }
                }
              ]
            }
          }
        ]}
      />
    </A2uiMediaProvider>
  )
  const icon = host.querySelector<HTMLElement>('[data-slot="a2ui-icon"]')!
  expect(icon.hidden).toBe(false)
  expect(icon.getAttribute('aria-label')).toBe('Favorite')
  expect(icon.querySelector('svg')).not.toBeNull()
})

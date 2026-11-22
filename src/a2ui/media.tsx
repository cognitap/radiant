'use client'

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
  type Ref
} from 'react'
import { cn } from 'cn'
import { useComposedRefs } from '../react/useComposedRefs.js'
import { AudioPlayer } from '../components/AudioPlayer/AudioPlayer.js'
import { useA2uiLabels } from './surfaceContext.js'

/** An icon component from the host's icon set. Radiant sizes it and hides it from assistive technology. */
export type A2uiIconComponent = ComponentType<{
  readonly className?: string
  readonly 'aria-hidden'?: true
}>

/** Maps A2UI icon names, such as `search` or `arrowBack`, to the host's icon components. */
export type A2uiIconMap = Readonly<Partial<Record<string, A2uiIconComponent>>>

/**
 * Host check for every media URL that passes Radiant's scheme check (http, https, blob, data).
 * Receives the absolute URL; return `false` to drop it.
 */
export type A2uiUrlPolicy = (
  url: string,
  context: { readonly component: string; readonly prop: string }
) => boolean

type MediaContextValue = { readonly icons?: A2uiIconMap; readonly urlPolicy?: A2uiUrlPolicy }

const A2uiMediaContext = createContext<MediaContextValue>({})

export type A2uiMediaProviderProps = {
  /** Icon components by A2UI name. Radiant bundles none. */
  readonly icons?: A2uiIconMap
  readonly urlPolicy?: A2uiUrlPolicy
  readonly children?: ReactNode
}

/** Provides the icon map and URL policy to every `A2uiSurface` below it. */
export function A2uiMediaProvider({ icons, urlPolicy, children }: A2uiMediaProviderProps) {
  const value = useMemo(() => ({ icons, urlPolicy }), [icons, urlPolicy])
  return <A2uiMediaContext value={value}>{children}</A2uiMediaContext>
}

const keyOf = (value: unknown) => {
  try {
    return typeof value === 'string' ? value : `\u0000${JSON.stringify(value)}`
  } catch {
    return `\u0000${typeof value}`
  }
}

/** Calls `report` once for each new value, after render. */
function useReportOnce<T>(value: T | undefined, report: ((value: T) => void) | undefined) {
  const reported = useRef(new Set<string>())
  useEffect(() => {
    if (value === undefined) return
    const key = keyOf(value)
    if (reported.current.has(key)) return
    reported.current.add(key)
    report?.(value)
  }, [value, report])
}

/** A data-model value the icon reads and follows, for names bound with `@path`. */
export type A2uiBoundValue = {
  /** Stable identity of the binding; a new key re-reads and resubscribes. */
  readonly key: string
  readonly read: () => unknown
  readonly subscribe: (onChange: (value: unknown) => void) => () => void
}

function useBoundValue(bound: A2uiBoundValue | undefined): unknown {
  const latest = useRef(bound)
  useLayoutEffect(() => {
    latest.current = bound
  })
  const [value, setValue] = useState(() => bound?.read())
  const key = bound?.key
  useEffect(() => {
    const source = latest.current
    if (!source) return
    setValue(source.read())
    return source.subscribe(setValue)
  }, [key])
  return bound ? value : undefined
}

export type A2uiIconProps = {
  readonly ref?: Ref<HTMLSpanElement>
  /** Name read from the data model; overrides `name`. */
  readonly boundName?: A2uiBoundValue
  /** Icon name looked up in the provided map. A non-string name renders nothing and is reported. */
  readonly name?: unknown
  /** A 24×24 SVG path drawn instead of a mapped icon. */
  readonly svgPath?: string
  /** Accessible name. Without one, the icon is decorative and hidden from assistive technology. */
  readonly label?: string
  /**
   * Called once per name that cannot render. A string name is reported only when a non-empty
   * icon map lacks it, so surfaces rendered before the host provides its map stay quiet.
   */
  readonly onMissing?: (name: unknown) => void
}

/** Renders a mapped or path icon at text size, or a hidden placeholder when there is no icon. */
export function A2uiIcon({ ref, boundName, svgPath, label, onMissing, ...rest }: A2uiIconProps) {
  const bound = useBoundValue(boundName)
  const name = boundName ? bound : rest.name
  const { icons } = useContext(A2uiMediaContext)
  const hasMap = icons !== undefined && Object.keys(icons).length > 0
  const Glyph =
    typeof name === 'string' && icons && Object.hasOwn(icons, name) ? icons[name] : undefined
  const missing =
    svgPath || Glyph || name === undefined || (typeof name === 'string' && !hasMap)
      ? undefined
      : name
  useReportOnce(missing, onMissing)

  if (!Glyph && !svgPath) {
    return (
      <span
        ref={ref}
        data-slot="a2ui-icon"
        hidden
      />
    )
  }
  return (
    <span
      ref={ref}
      data-slot="a2ui-icon"
      className="inline-flex size-[1.25em] shrink-0 items-center justify-center align-middle"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      {Glyph ? (
        <Glyph
          className="size-full"
          aria-hidden
        />
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          className="size-full"
        >
          <path d={svgPath} />
        </svg>
      )}
    </span>
  )
}

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'blob:', 'data:'])

/**
 * Resolves the owning document's base URL after mount. Until then relative URLs are held back,
 * so server and first client render match and nothing loads against an unchecked base.
 */
function useDocumentBase() {
  const [base, setBase] = useState<string | undefined>(undefined)
  const element = useRef<HTMLElement | null>(null)
  useLayoutEffect(() => {
    setBase(element.current?.ownerDocument.baseURI)
  }, [])
  return [base, element] as const
}

type UrlCheck = { readonly src?: string; readonly rejected?: string }

function checkUrl(
  url: string | undefined,
  base: string | undefined,
  policy: A2uiUrlPolicy | undefined,
  component: string,
  prop: string
): UrlCheck {
  if (!url) return {}
  let resolved: URL
  try {
    resolved = base ? new URL(url, base) : new URL(url)
  } catch {
    return base ? { rejected: url } : {}
  }
  if (!SAFE_PROTOCOLS.has(resolved.protocol)) return { rejected: url }
  if (policy && !policy(resolved.href, { component, prop })) return { rejected: url }
  return { src: url }
}

export type A2uiRejectedUrl = { readonly url: string; readonly prop: string }

type MediaProps = {
  readonly onRejectedUrl?: (rejected: A2uiRejectedUrl) => void
}

function useCheckedUrl(
  url: string | undefined,
  base: string | undefined,
  component: string,
  prop: string,
  onRejectedUrl: MediaProps['onRejectedUrl']
): string | undefined {
  const { urlPolicy } = useContext(A2uiMediaContext)
  const check = checkUrl(url, base, urlPolicy, component, prop)
  const rejected = check.rejected === undefined ? undefined : { url: check.rejected, prop }
  useReportOnce(rejected, onRejectedUrl)
  return check.src
}

const FIXED_SIZE_VARIANTS: Record<string, string> = {
  icon: 'size-6',
  avatar: 'size-10 rounded-full'
}

const FLUID_VARIANTS: Record<string, string> = {
  smallFeature: 'w-24 max-w-full',
  mediumFeature: 'w-full max-w-xs',
  largeFeature: 'w-full max-w-lg',
  header: 'w-full max-h-64'
}

const IMAGE_FIT: Record<string, string> = {
  contain: 'object-contain',
  cover: 'object-cover',
  fill: 'object-fill',
  none: 'object-none',
  scaleDown: 'object-scale-down'
}

export type A2uiImageProps = MediaProps & {
  readonly ref?: Ref<HTMLImageElement>
  readonly url?: string
  readonly alt: string
  readonly fit?: string
  readonly variant?: string
}

export function A2uiImage({ ref, url, alt, fit, variant, onRejectedUrl }: A2uiImageProps) {
  const [base, element] = useDocumentBase()
  const src = useCheckedUrl(url, base, 'Image', 'url', onRejectedUrl)
  const fixed = variant ? FIXED_SIZE_VARIANTS[variant] : undefined
  return (
    <img
      ref={useComposedRefs(element, ref)}
      data-slot="a2ui-image"
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      className={cn(
        'block',
        fixed ?? cn('h-auto', (variant && FLUID_VARIANTS[variant]) || FLUID_VARIANTS.mediumFeature),
        (fit && IMAGE_FIT[fit]) || IMAGE_FIT.fill
      )}
    />
  )
}

export type A2uiVideoProps = MediaProps & {
  readonly ref?: Ref<HTMLVideoElement>
  readonly url?: string
  readonly posterUrl?: string
  readonly label?: string
}

export function A2uiVideo({ ref, url, posterUrl, label, onRejectedUrl }: A2uiVideoProps) {
  const [base, element] = useDocumentBase()
  const src = useCheckedUrl(url, base, 'Video', 'url', onRejectedUrl)
  const poster = useCheckedUrl(posterUrl, base, 'Video', 'posterUrl', onRejectedUrl)
  return (
    // oxlint-disable-next-line jsx-a11y/media-has-caption -- A2UI 1.0 media has no caption tracks.
    <video
      ref={useComposedRefs(element, ref)}
      data-slot="a2ui-video"
      controls
      preload="metadata"
      src={src}
      poster={poster}
      aria-label={label}
      className="block h-auto w-full max-w-full"
    />
  )
}

export type A2uiAudioPlayerProps = MediaProps & {
  readonly ref?: Ref<HTMLElement>
  readonly url?: string
  /** Visible caption; names the audio unless `label` is set. */
  readonly description?: string
  readonly label?: string
  /** Called after render when the surface labels lack the player's control names. */
  readonly onNativeControls?: () => void
}

/**
 * Renders Radiant's `AudioPlayer` when the surface `labels` name its controls and the URL is
 * usable, and the browser's native controls otherwise.
 */
export function A2uiAudioPlayer({
  ref,
  url,
  description,
  label,
  onRejectedUrl,
  onNativeControls
}: A2uiAudioPlayerProps) {
  const [base, element] = useDocumentBase()
  const src = useCheckedUrl(url, base, 'AudioPlayer', 'url', onRejectedUrl)
  const captionId = useId()
  const labels = useA2uiLabels()
  const playLabel = labels.audioPlay?.trim()
  const pauseLabel = labels.audioPause?.trim()
  const seekLabel = labels.audioSeek?.trim()
  const styled = Boolean(playLabel && pauseLabel && seekLabel)
  const reportNative = useRef(onNativeControls)
  useLayoutEffect(() => {
    reportNative.current = onNativeControls
  })
  useEffect(() => {
    if (!styled) reportNative.current?.()
  }, [styled])
  const labelledBy = label || !description ? undefined : captionId
  return (
    <figure
      ref={useComposedRefs(element, ref)}
      data-slot="a2ui-audio-player"
      className="m-0 grid gap-1"
    >
      {description ? (
        <figcaption
          id={captionId}
          className="text-[length:var(--rad-typography-roles-ui-supporting-size,0.8125rem)] [color:var(--rad-color-muted-foreground,oklch(0.45_0.01_286))]"
        >
          {description}
        </figcaption>
      ) : null}
      {styled && src ? (
        <AudioPlayer
          src={src}
          errorText={labels.audioError?.trim() || undefined}
          playLabel={playLabel!}
          pauseLabel={pauseLabel!}
          seekLabel={seekLabel!}
          aria-label={label}
          aria-labelledby={labelledBy}
        />
      ) : (
        // oxlint-disable-next-line jsx-a11y/media-has-caption -- A2UI 1.0 media has no caption tracks.
        <audio
          controls
          preload="metadata"
          src={src}
          aria-label={label}
          aria-labelledby={labelledBy}
          className="block w-full"
        />
      )}
    </figure>
  )
}

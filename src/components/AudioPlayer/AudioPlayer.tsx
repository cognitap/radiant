'use client'

import {
  Children,
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type PointerEvent,
  type ReactNode,
  type Ref
} from 'react'
import { cn } from 'cn'
import { requireAccessibleName, type AccessibleName } from '../../internal/accessibleName.js'
import { joinIds } from '../../internal/ids.js'
import { useComposedRefs } from '../../react/useComposedRefs.js'
import { useLocale } from '../../react/useLocale.js'
import type { ControlSize, PartStyle } from '../../presentation.js'
import type { ThemeStyle } from '../../themes/defineTheme.js'
import { Button } from '../Button/Button.js'
import { WithoutField } from '../Field/Field.js'
import { Slider } from '../Slider/Slider.js'
import { formatClock, formatSpokenTime, isKnownDuration } from './audioTime.js'

type Group = {
  /** Pauses the group's playing element, unless it is this one, and records this one. */
  readonly claim: (audio: HTMLAudioElement) => void
  readonly release: (audio: HTMLAudioElement) => void
}

const AudioPlayerGroupContext = createContext<Group | null>(null)

function createGroup(): Group {
  let current: HTMLAudioElement | null = null
  return {
    claim(audio) {
      if (current && current !== audio) current.pause()
      current = audio
    },
    release(audio) {
      if (current === audio) current = null
    }
  }
}

export type AudioPlayerGroupProps = { children?: ReactNode }

/**
 * Lets one `AudioPlayer` below it play at a time: starting one pauses the one playing. Renders
 * no element; players outside every group play independently.
 */
export function AudioPlayerGroup({ children }: AudioPlayerGroupProps) {
  const [group] = useState(createGroup)
  return <AudioPlayerGroupContext value={group}>{children}</AudioPlayerGroupContext>
}

/** `paused` covers a clip that has not started or has ended. */
export type AudioPlayerState = 'paused' | 'playing' | 'error'

type Mode =
  | ({
      /** A single play button; it needs a name for the clip, as nothing else describes it. */
      compact: true
      seekLabel?: undefined
    } & AccessibleName)
  | ({
      compact?: false
      /** Name of the scrubber, such as `Seek`. */
      seekLabel: string
    } & Partial<AccessibleName>)

export type AudioPlayerProps = Omit<
  ComponentProps<'div'>,
  'children' | 'style' | 'role' | 'aria-label' | 'aria-labelledby'
> &
  Mode & {
    /** Media URL. Put `<source>` or `<track>` elements in `children` instead for alternatives. */
    src?: string
    /** Native preload hint; `metadata` loads the length without the audio. */
    preload?: 'none' | 'metadata' | 'auto'
    loop?: boolean
    muted?: boolean
    crossOrigin?: ComponentProps<'audio'>['crossOrigin']
    /** Name of the toggle while the clip is paused. The name switches, so the change is announced. */
    playLabel: string
    /** Name of the toggle while the clip plays. */
    pauseLabel: string
    /** Shown and announced when the media fails to load or decode. */
    errorText?: ReactNode
    /** Formats the time display; defaults to the closest `LocaleProvider`. */
    locale?: string
    controlSize?: ControlSize
    onPlayingChange?: (playing: boolean) => void
    /** The `<audio>` element, which owns playback, for volume, rate or other media APIs. */
    mediaRef?: Ref<HTMLAudioElement>
    /** Native `<source>` and `<track>` children of the audio element. */
    children?: ReactNode
    parts?: { toggle?: PartStyle; scrubber?: PartStyle; time?: PartStyle; error?: PartStyle }
    style?: ThemeStyle
    'data-slot'?: string
  }

const PlayIcon = () => (
  <svg
    viewBox="0 0 16 16"
    aria-hidden="true"
    focusable="false"
    fill="currentColor"
  >
    <path d="M4 2.5v11a.5.5 0 0 0 .76.43l9-5.5a.5.5 0 0 0 0-.86l-9-5.5A.5.5 0 0 0 4 2.5Z" />
  </svg>
)

const PauseIcon = () => (
  <svg
    viewBox="0 0 16 16"
    aria-hidden="true"
    focusable="false"
    fill="currentColor"
  >
    <rect
      x="3"
      y="2"
      width="3.5"
      height="12"
      rx="1"
    />
    <rect
      x="9.5"
      y="2"
      width="3.5"
      height="12"
      rx="1"
    />
  </svg>
)

const frameClass = [
  'box-border',
  'p-[var(--rad-audio-player-padding,0.375rem)] rounded-[var(--rad-audio-player-radius,var(--rad-control-radius,0.5rem))]',
  '[border-style:solid] [border-width:var(--rad-audio-player-border-width,1px)] [border-color:var(--rad-audio-player-border-color,var(--rad-color-border,oklch(0.885_0.005_286)))]',
  'bg-[var(--rad-audio-player-background,var(--rad-color-surface,oklch(1_0_0)))]',
  'forced-colors:border-[CanvasText]'
].join(' ')

const timeClass = [
  'shrink-0 whitespace-nowrap tabular-nums',
  'text-[length:var(--rad-audio-player-time-size,var(--rad-typography-roles-ui-supporting-size,0.8125rem))]',
  '[color:var(--rad-audio-player-time-color,var(--rad-color-muted-foreground,oklch(0.45_0.01_286)))]',
  'forced-colors:text-[CanvasText]'
].join(' ')

type Media = {
  playing: boolean
  busy: boolean
  failed: boolean
  duration: number
  time: number
}

const initialMedia: Media = { playing: false, busy: false, failed: false, duration: NaN, time: 0 }

const isPlaying = (audio: HTMLAudioElement) => !audio.paused && !audio.ended

function read(audio: HTMLAudioElement, busy: boolean, sourceFailed: boolean): Media {
  const failed = sourceFailed || audio.error !== null
  return {
    playing: !failed && isPlaying(audio),
    busy: busy && !failed,
    failed,
    duration: audio.duration,
    time: audio.currentTime
  }
}

/**
 * A styled player for a short clip on one native `<audio>` element: a play/pause toggle, a
 * scrubber built on `Slider` (arrow keys step 1%, Page keys 10%, Home and End jump to the
 * ends, following the text direction), and the elapsed and total time in the locale's digits.
 *
 * The media element owns playback: `onPlayingChange` reports it, and `mediaRef` reaches the
 * element for volume or rate. The scrubber is disabled until a positive length is known; a
 * stream of unknown length shows no total. A pointer drag seeks on release, and while the
 * clip plays the focused scrubber keeps its value until it seeks, pauses or ends, so a screen
 * reader is not interrupted by each time update. While loading or buffering the root has
 * `aria-busy`. When the media or every `<source>` fails, the root has `data-state="error"`,
 * the controls are disabled and `errorText` is announced; without `errorText` the failure has
 * no text. The toggle is disabled without `src` or children. The element reads `<source>`
 * children when it loads, so give the player a new `key` to load changed sources. Time
 * updates move the scrubber without animation.
 */
export function AudioPlayer({
  src,
  preload = 'metadata',
  loop,
  muted,
  crossOrigin,
  playLabel,
  pauseLabel,
  seekLabel,
  compact = false,
  errorText,
  locale: localeProp,
  controlSize = 'medium',
  onPlayingChange,
  mediaRef,
  children,
  parts,
  className,
  ...props
}: AudioPlayerProps) {
  if (!playLabel?.trim() || !pauseLabel?.trim())
    throw new TypeError('AudioPlayer requires nonempty playLabel and pauseLabel.')
  if (compact) requireAccessibleName('Compact AudioPlayer', props)
  else if (!seekLabel?.trim()) throw new TypeError('AudioPlayer requires a nonempty seekLabel.')
  if (!['none', 'metadata', 'auto'].includes(preload))
    throw new TypeError('AudioPlayer preload must be none, metadata or auto.')
  const locale = useLocale(localeProp)
  const group = useContext(AudioPlayerGroupContext)
  const audioRef = useRef<HTMLAudioElement>(null)
  const timeId = useId()
  const errorId = useId()
  const [media, setMedia] = useState(initialMedia)
  // A drag's value, shown and sought on release; null while no pointer drags the thumb.
  const [dragValue, setDragValue] = useState<number | null>(null)
  // The scrubber value a focused scrubber keeps while the clip plays; null when it follows.
  const [heldValue, setHeldValue] = useState<number | null>(null)
  const dragging = useRef(false)
  const sourceFailed = useRef(false)
  const waiting = useRef(false)
  const playingRef = useRef(false)
  const notify = useRef(onPlayingChange)
  useLayoutEffect(() => {
    notify.current = onPlayingChange
  })

  const sync = (busy?: boolean) => {
    const audio = audioRef.current
    if (!audio) return
    const next = read(audio, busy ?? false, sourceFailed.current)
    setMedia(previous =>
      busy === undefined ? { ...next, busy: previous.busy && !next.failed } : next
    )
    if (next.playing !== playingRef.current) {
      playingRef.current = next.playing
      notify.current?.(next.playing)
    }
  }

  // Media events can fire before hydration attaches handlers, so read the element once.
  useLayoutEffect(() => {
    const audio = audioRef.current!
    setMedia(
      read(audio, audio.readyState < 1 && audio.networkState === audio.NETWORK_LOADING, false)
    )
    // Source errors do not bubble, so listen in the capture phase.
    const onSourceError = (event: Event) => {
      const source = event.target as Element
      if (source === audio || source.localName !== 'source') return
      const sources = audio.querySelectorAll(':scope > source')
      if (sources[sources.length - 1] !== source) return
      sourceFailed.current = true
      sync(false)
    }
    audio.addEventListener('error', onSourceError, true)
    return () => {
      audio.removeEventListener('error', onSourceError, true)
      group?.release(audio)
      if (playingRef.current) {
        playingRef.current = false
        notify.current?.(false)
      }
    }
  }, [group])

  const { playing, busy, failed, duration, time } = media
  const known = isKnownDuration(duration) && duration > 0
  const clamped = known ? Math.min(time, duration) : 0
  const scrubValue = dragValue ?? (playing ? (heldValue ?? clamped) : clamped)
  const withHours = known && duration >= 3600
  const elapsed = formatClock(dragValue ?? clamped, locale, withHours)
  const total = known ? formatClock(duration, locale, withHours) : '--:--'
  const state: AudioPlayerState = failed ? 'error' : playing ? 'playing' : 'paused'
  const playable = Boolean(src) || Children.count(children) > 0

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused || audio.ended) {
      // A refused autoplay or an interrupted load leaves the player paused.
      void audio.play().catch(() => sync())
    } else audio.pause()
  }

  // Moves a held value; a scrubber that is not focused holds none.
  const holdAt = (value: number) => setHeldValue(previous => (previous === null ? null : value))

  const seek = (value: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = value
    setMedia(previous => ({ ...previous, time: value }))
    holdAt(value)
  }

  const startDrag = (event: PointerEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    if (input.disabled || event.button !== 0) return
    dragging.current = true
    setDragValue(input.valueAsNumber)
    const doc = input.ownerDocument
    const end = () => {
      doc.removeEventListener('pointerup', end, true)
      doc.removeEventListener('pointercancel', end, true)
      dragging.current = false
      seek(input.valueAsNumber)
      setDragValue(null)
    }
    doc.addEventListener('pointerup', end, true)
    doc.addEventListener('pointercancel', end, true)
  }

  return (
    <div
      {...props}
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- A fieldset would add form semantics; the group only names the clip.
      role="group"
      data-slot={joinIds('audio-player', props['data-slot'])}
      data-state={state}
      data-compact={compact ? '' : undefined}
      data-control-size={controlSize}
      aria-busy={busy ? true : undefined}
      aria-describedby={joinIds(
        props['aria-describedby'],
        failed && errorText ? errorId : undefined
      )}
      className={cn(
        'inline-flex min-w-0 max-w-full flex-wrap items-center gap-[var(--rad-audio-player-gap,0.5rem)]',
        !compact && cn('w-full', frameClass),
        className
      )}
    >
      {/* oxlint-disable-next-line jsx-a11y/media-has-caption -- Callers pass track children for captions. */}
      <audio
        ref={useComposedRefs(audioRef, mediaRef)}
        data-slot="audio-player-media"
        src={src}
        preload={preload}
        loop={loop}
        muted={muted}
        crossOrigin={crossOrigin}
        onPlay={event => {
          group?.claim(event.currentTarget)
          sync()
        }}
        onPause={event => {
          group?.release(event.currentTarget)
          waiting.current = false
          holdAt(event.currentTarget.currentTime)
          sync(false)
        }}
        onEnded={event => {
          holdAt(event.currentTarget.currentTime)
          sync(false)
        }}
        onPlaying={() => {
          waiting.current = false
          sync(false)
        }}
        onWaiting={() => {
          waiting.current = true
          sync(true)
        }}
        onLoadStart={event => {
          sourceFailed.current = false
          sync(preload !== 'none' || !event.currentTarget.paused)
        }}
        onLoadedMetadata={() => sync(waiting.current)}
        onDurationChange={() => sync()}
        onCanPlay={() => {
          waiting.current = false
          sync(false)
        }}
        onSuspend={event => {
          if (event.currentTarget.readyState >= 1 && !waiting.current) sync(false)
        }}
        onTimeUpdate={() => sync()}
        onSeeked={() => sync()}
        onEmptied={event => {
          group?.release(event.currentTarget)
          waiting.current = false
          holdAt(0)
          sync(false)
        }}
        onError={() => sync(false)}
      >
        {children}
      </audio>
      <Button
        variant={compact ? 'soft' : 'ghost'}
        tone="neutral"
        iconOnly
        controlSize={controlSize}
        disabled={failed || !playable}
        aria-label={playing ? pauseLabel : playLabel}
        data-slot="audio-player-toggle"
        className={parts?.toggle?.className}
        style={parts?.toggle?.style}
        onClick={toggle}
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
      </Button>
      {compact ? null : (
        <>
          <WithoutField>
            <Slider
              min={0}
              max={known ? duration : 0}
              step="any"
              value={scrubValue}
              disabled={failed || !known}
              controlSize={controlSize}
              aria-label={seekLabel}
              aria-valuetext={formatSpokenTime(scrubValue, locale)}
              aria-describedby={timeId}
              data-slot="audio-player-scrubber"
              className={cn('min-w-16 flex-1 basis-24', parts?.scrubber?.className)}
              style={parts?.scrubber?.style}
              onFocus={() => setHeldValue(clamped)}
              onBlur={() => setHeldValue(null)}
              onPointerDown={startDrag}
              onKeyDown={event => {
                // Keys step from the playing position, not the held one.
                const audio = audioRef.current
                if (audio && heldValue !== null && playing)
                  event.currentTarget.value = String(Math.min(audio.currentTime, duration))
              }}
              onValueChange={next => (dragging.current ? setDragValue(next) : seek(next))}
            />
          </WithoutField>
          <span
            id={timeId}
            data-slot="audio-player-time"
            className={cn(timeClass, parts?.time?.className)}
            style={parts?.time?.style}
          >
            <bdi>{elapsed}</bdi> / <bdi>{total}</bdi>
          </span>
        </>
      )}
      <output
        id={errorId}
        data-slot="audio-player-error"
        className={cn(
          'min-w-0 basis-full text-[length:var(--rad-typography-roles-ui-supporting-size,0.8125rem)] [color:var(--rad-color-invalid,oklch(0.56_0.19_25))] [overflow-wrap:anywhere] empty:absolute empty:size-px empty:overflow-hidden forced-colors:text-[CanvasText]',
          parts?.error?.className
        )}
        style={parts?.error?.style}
      >
        {failed ? errorText : null}
      </output>
    </div>
  )
}

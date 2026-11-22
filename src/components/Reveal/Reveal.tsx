'use client'

import {
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode
} from 'react'
import { cn } from 'cn'
import { joinIds } from '../../internal/ids.js'
import { MotionProfileContext } from '../../motion/context.js'
import { useComposedRefs } from '../../react/useComposedRefs.js'
import { useControllableState } from '../../react/useControllableState.js'
import type { ValueOwner } from '../../react/useNativeOwner.js'
import type { ControlSize, PartStyle, Spacing } from '../../presentation.js'
import type { ThemeStyle } from '../../themes/defineTheme.js'
import { Button } from '../Button/Button.js'
import { pickLayoutClass, spacingGapClasses } from '../shared/layoutStyles.js'

export type RevealItem = {
  value: string
  children: ReactNode
  /** Milliseconds this step shows during playback, in place of the Reveal's `interval`. */
  interval?: number
}

type PlaybackTiming = {
  /** Milliseconds each step shows during playback: 5000 unless set, from 1000 to 60000. */
  interval?: number
  /** Return to the first step after the last instead of stopping. */
  loop?: boolean
}

/**
 * Optional playback. With `playback`, a toggle named `playLabel` or `pauseLabel` moves to the
 * next step every `interval` once the user presses it. Under reduced motion or theme motion
 * `off` the toggle is absent and nothing plays. Playback waits while the pointer or focus is
 * inside other than on the toggle, and while the page is in the background. Previous and next
 * stop it, as does an owner that declines a step; an owner that applies the value later counts
 * as declining. After the last step it stops, or returns to the first with `loop`; play at the
 * last step without `loop` starts over. Timed steps are not announced; previous, next and the
 * last step are.
 */
export type RevealPlayback =
  | (PlaybackTiming & {
      playback?: false
      playLabel?: string
      pauseLabel?: string
    })
  | (PlaybackTiming & {
      playback: true
      /** Name of the playback toggle while paused. */
      playLabel: string
      /** Name of the playback toggle while playing. */
      pauseLabel: string
    })

/**
 * Div host that shows one of `items` at a time with previous and next buttons. Hidden steps
 * stay mounted, so their state survives. Each step is a group named by its position text, and
 * the steps form a polite live region, so a newly shown step is announced once.
 */
export type RevealProps = Omit<ComponentProps<'div'>, 'style' | 'children' | 'defaultValue'> &
  ValueOwner<string> &
  RevealPlayback & {
    items: readonly RevealItem[]
    onValueChange?: (value: string) => void
    /** Text of the button that shows the previous step. */
    previousLabel: string
    /** Text of the button that shows the next step. */
    nextLabel: string
    /**
     * Position text, such as `Step 2 of 4`, for a zero-based index: shown between the buttons and
     * naming each step group.
     */
    positionLabel: (index: number, count: number) => string
    /** Space between the step and its controls from the theme spacing scale. */
    gap?: Spacing
    controlSize?: ControlSize
    parts?: { controls?: PartStyle; position?: PartStyle }
    style?: ThemeStyle
    'data-slot'?: string
  }

/** Content shown one step at a time, moved through with previous and next buttons. */
export function Reveal({
  items,
  value,
  defaultValue,
  onValueChange,
  previousLabel,
  nextLabel,
  positionLabel,
  playback,
  playLabel,
  pauseLabel,
  interval = 5000,
  loop = false,
  gap = 'normal',
  controlSize = 'medium',
  parts,
  className,
  ref,
  onPointerOver,
  onPointerOut,
  onFocus,
  onBlur,
  ...props
}: RevealProps) {
  if (!previousLabel?.trim() || !nextLabel?.trim())
    throw new TypeError('Reveal requires nonempty previousLabel and nextLabel.')
  if (typeof positionLabel !== 'function')
    throw new TypeError('Reveal requires a positionLabel function.')
  const keys = items.map(item => item.value)
  if (!keys.length || keys.some(key => !key.trim()) || new Set(keys).size !== keys.length)
    throw new TypeError('Reveal items need unique nonempty values.')
  const playable = playback === true
  if (playable && (!playLabel?.trim() || !pauseLabel?.trim()))
    throw new TypeError('Reveal playback requires nonempty playLabel and pauseLabel.')
  const delays = items.map(item => item.interval ?? interval)
  if (playable && delays.some(delay => !Number.isFinite(delay) || delay < 1000 || delay > 60000))
    throw new TypeError('Reveal intervals must be from 1000 to 60000ms.')
  const owner = useControllableState({
    name: 'Reveal value',
    value,
    defaultValue,
    initialValue: keys[0]!,
    onChange: onValueChange
  })
  const found = keys.indexOf(owner.value)
  // A removed step falls back to the first one unless the app owns the value.
  if (found < 0 && owner.controlled) throw new TypeError('Reveal value must match an item.')
  const index = Math.max(found, 0)
  const last = keys.length - 1
  const stepsId = useId()
  const root = useRef<HTMLDivElement>(null)
  const composed = useComposedRefs(root, ref)
  const toggle = useRef<HTMLButtonElement>(null)
  const motion = useContext(MotionProfileContext)
  const [playing, setPlaying] = useState(false)
  // Reduced until the browser says otherwise, so server markup offers no playback.
  const [reduced, setReduced] = useState(true)
  const [hidden, setHidden] = useState(false)
  const [pointerInside, setPointerInside] = useState(false)
  const [focusInside, setFocusInside] = useState(false)
  // The step playback last asked for; the next render tells whether the owner took it.
  const [awaiting, setAwaiting] = useState<string | null>(null)
  const offered = playable && !reduced && motion.mode !== 'off' && keys.length > 1
  let declined = false
  if (awaiting !== null) {
    setAwaiting(null)
    declined = owner.value !== awaiting
  }
  if (playing && (declined || !offered || (!loop && index === last))) setPlaying(false)
  const running = playing && offered && !pointerInside && !focusInside && !hidden
  const request = useRef(owner.request)
  useLayoutEffect(() => {
    request.current = owner.request
  })
  useEffect(() => {
    const node = root.current
    if (!playable || !node) return
    const doc = node.ownerDocument
    const query = doc.defaultView!.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => {
      setReduced(query.matches)
      setHidden(doc.visibilityState === 'hidden')
    }
    sync()
    query.addEventListener('change', sync)
    doc.addEventListener('visibilitychange', sync)
    return () => {
      query.removeEventListener('change', sync)
      doc.removeEventListener('visibilitychange', sync)
    }
  }, [playable])
  // A step to show once the live region is polite again, so the change is announced.
  const deferred = useRef<{ index: number; refocus: boolean } | null>(null)
  const toggleFocused = useRef(false)
  const following = keys[index === last ? 0 : index + 1]!
  const delay = delays[index]!
  useEffect(() => {
    if (!running) return
    const view = root.current!.ownerDocument.defaultView!
    const timer = view.setTimeout(() => {
      if (!loop && index + 1 === last) {
        // Playback ends here: the live region turns polite before the last step shows.
        deferred.current = { index: last, refocus: false }
        setPlaying(false)
        return
      }
      setAwaiting(following)
      request.current(following)
    }, delay)
    return () => view.clearTimeout(timer)
  }, [running, following, delay, loop, index, last])
  const previous = useRef<HTMLButtonElement>(null)
  const next = useRef<HTMLButtonElement>(null)
  // When a button disables itself at either end, focus moves to the other one. React commits a
  // click's update before the queued clear runs, so a change the app declines moves nothing.
  const refocus = useRef<{ index: number; button: 'previous' | 'next' } | null>(null)
  useLayoutEffect(() => {
    const pending = refocus.current
    refocus.current = null
    if (!pending || pending.index !== index) return
    const button = (pending.button === 'previous' ? previous : next).current
    if (button && !button.disabled) button.focus()
  })
  const move = (target: number, moveFocus: boolean) => {
    refocus.current = !moveFocus
      ? null
      : target === 0
        ? { index: target, button: 'next' }
        : target === last
          ? { index: target, button: 'previous' }
          : null
    owner.request(keys[target]!)
    queueMicrotask(() => {
      refocus.current = null
    })
  }
  useLayoutEffect(() => {
    const pending = deferred.current
    deferred.current = null
    if (pending) move(pending.index, pending.refocus)
  })
  // A toggle that leaves while focused hands focus to an enabled step button.
  useLayoutEffect(() => {
    if (offered || !toggleFocused.current) return
    toggleFocused.current = false
    const button = [next.current, previous.current].find(node => node && !node.disabled)
    button?.focus()
  }, [offered])
  const go = (direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= keys.length) return
    if (!playing) return move(target, true)
    deferred.current = { index: target, refocus: true }
    setPlaying(false)
  }
  const position = (
    <output
      data-slot="reveal-position"
      aria-live={playing ? 'off' : undefined}
      className={cn(
        '[color:var(--rad-color-muted-foreground,oklch(0.45_0.01_286))] tabular-nums',
        parts?.position?.className
      )}
      style={parts?.position?.style}
    >
      {positionLabel(index, keys.length)}
    </output>
  )
  return (
    <div
      {...props}
      ref={composed}
      data-slot={joinIds('reveal', props['data-slot'])}
      data-playing={running ? '' : undefined}
      className={cn(
        'box-border grid min-w-0',
        pickLayoutClass('Reveal', spacingGapClasses, 'gap', gap),
        className
      )}
      // The pointer or focus on the toggle itself keeps playing, so pressing play takes effect.
      onPointerOver={event => {
        onPointerOver?.(event)
        if (playable) setPointerInside(!toggle.current?.contains(event.target as Node))
      }}
      onPointerOut={event => {
        onPointerOut?.(event)
        if (playable && !event.currentTarget.contains(event.relatedTarget as Node | null))
          setPointerInside(false)
      }}
      onFocus={event => {
        onFocus?.(event)
        if (!playable) return
        toggleFocused.current = event.target === (toggle.current as EventTarget | null)
        setFocusInside(!toggleFocused.current)
      }}
      onBlur={event => {
        onBlur?.(event)
        if (!playable || event.currentTarget.contains(event.relatedTarget)) return
        toggleFocused.current = false
        setFocusInside(false)
      }}
    >
      <div
        id={stepsId}
        data-slot="reveal-steps"
        aria-live={playing ? 'off' : 'polite'}
        className="grid min-w-0"
      >
        {items.map((item, itemIndex) => (
          <div
            key={item.value}
            // A fieldset would add form semantics; the role only names the step.
            // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
            role="group"
            aria-label={positionLabel(itemIndex, keys.length)}
            data-slot="reveal-step"
            data-selected={itemIndex === index ? '' : undefined}
            hidden={itemIndex !== index}
            className="min-w-0"
          >
            {item.children}
          </div>
        ))}
      </div>
      <div
        data-slot="reveal-controls"
        className={cn(
          'flex min-w-0 flex-wrap items-center justify-between gap-[var(--rad-spacing-tight,0.5rem)]',
          parts?.controls?.className
        )}
        style={parts?.controls?.style}
      >
        <Button
          ref={previous}
          variant="outline"
          controlSize={controlSize}
          data-slot="reveal-previous"
          aria-controls={stepsId}
          disabled={index === 0}
          onClick={() => go(-1)}
        >
          {previousLabel}
        </Button>
        {playable ? (
          <div
            data-slot="reveal-playback"
            className="flex min-w-0 flex-wrap items-center gap-[var(--rad-spacing-tight,0.5rem)]"
          >
            {position}
            {offered ? (
              <Button
                ref={toggle}
                variant="outline"
                controlSize={controlSize}
                data-slot="reveal-play"
                aria-controls={stepsId}
                onClick={() => {
                  if (!playing && !loop && index === last) {
                    setAwaiting(keys[0]!)
                    owner.request(keys[0]!)
                  }
                  setPlaying(!playing)
                }}
              >
                {playing ? pauseLabel : playLabel}
              </Button>
            ) : null}
          </div>
        ) : (
          position
        )}
        <Button
          ref={next}
          controlSize={controlSize}
          data-slot="reveal-next"
          aria-controls={stepsId}
          disabled={index === keys.length - 1}
          onClick={() => go(1)}
        >
          {nextLabel}
        </Button>
      </div>
    </div>
  )
}
